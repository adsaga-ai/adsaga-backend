const modelRepository = require('./models.data');
const responseHandler = require('../../utils/response-handler');

class ModelController {

  async create(req, res, next) {
    try {
      const { 
        model_name, 
        model_type, 
        input_token_amount, 
        input_token_counts, 
        output_token_amount, 
        output_token_counts 
      } = req.body;

      // Check if model with same name already exists
      const existingModel = await modelRepository.findByName(model_name);
      if (existingModel) {
        return responseHandler.error(res, 'Model with this name already exists', 409);
      }

      // Calculate pricing and credits
      const input_tokens_per_dollar = input_token_counts / input_token_amount;
      const output_tokens_per_dollar = output_token_counts / output_token_amount;
      const input_credits_per_token = 1 / input_tokens_per_dollar;
      const output_credits_per_token = 1 / output_tokens_per_dollar;

      const modelData = {
        model_name,
        model_type,
        input_tokens_per_dollar,
        output_tokens_per_dollar,
        input_credits_per_token,
        output_credits_per_token
      };

      const model = await modelRepository.create(modelData);
      
      return responseHandler.success(res, { model }, 'Model created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create model');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getById(req, res, next) {
    try {
      const { model_id } = req.params;
      const model = await modelRepository.findById(model_id);
      
      if (!model) {
        return responseHandler.error(res, 'Model not found', 404);
      }
      
      return responseHandler.success(res, { model }, 'Model retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to get model by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async list(req, res, next) {
    try {
      const { search, model_type, page = 1, limit = 10 } = req.query;
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Prepare filters
      const filters = {
        search,
        model_type,
        limit: parseInt(limit),
        offset
      };

      // Get models and total count
      const [models, totalCount] = await Promise.all([
        modelRepository.findAll(filters),
        modelRepository.count(filters)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return responseHandler.success(res, {
        models,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }, 'Models retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to list models');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async update(req, res, next) {
    try {
      const { model_id } = req.params;
      const updateData = req.body;

      // Check if model exists
      const existingModel = await modelRepository.findById(model_id);
      if (!existingModel) {
        return responseHandler.error(res, 'Model not found', 404);
      }

      // Check if model name is being updated and if it conflicts with existing model
      if (updateData.model_name && updateData.model_name !== existingModel.model_name) {
        const modelWithSameName = await modelRepository.findByName(updateData.model_name);
        if (modelWithSameName) {
          return responseHandler.error(res, 'Model with this name already exists', 409);
        }
      }

      // Calculate pricing and credits if token amounts are provided
      if (updateData.input_token_amount && updateData.input_token_counts) {
        updateData.input_tokens_per_dollar = updateData.input_token_counts / updateData.input_token_amount;
        updateData.input_credits_per_token = 1 / updateData.input_tokens_per_dollar;
      }

      if (updateData.output_token_amount && updateData.output_token_counts) {
        updateData.output_tokens_per_dollar = updateData.output_token_counts / updateData.output_token_amount;
        updateData.output_credits_per_token = 1 / updateData.output_tokens_per_dollar;
      }

      // Remove the input parameters as they're not stored in database
      delete updateData.input_token_amount;
      delete updateData.input_token_counts;
      delete updateData.output_token_amount;
      delete updateData.output_token_counts;

      const model = await modelRepository.update(model_id, updateData);
      
      return responseHandler.success(res, { model }, 'Model updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update model');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async delete(req, res, next) {
    try {
      const { model_id } = req.params;
      
      const model = await modelRepository.delete(model_id);
      if (!model) {
        return responseHandler.error(res, 'Model not found', 404);
      }
      
      return responseHandler.success(res, null, 'Model deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete model');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new ModelController();
