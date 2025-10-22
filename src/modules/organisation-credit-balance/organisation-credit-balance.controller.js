const organisationCreditBalanceRepository = require('./organisation-credit-balance.data');
const organisationCreditTransactionRepository = require('./organisation-credit-transaction.data');
const responseHandler = require('../../utils/response-handler');

class OrganisationCreditBalanceController {
  // Create organisation credit balance (if already exists then error)
  async createCreditBalance(req, res, next) {
    try {
      const { organisation_id, credit_balance = 0.00 } = req.body;
      
      // Check if credit balance already exists for this organisation
      const existingBalance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
      if (existingBalance) {
        return responseHandler.error(res, 'Credit balance already exists for this organisation', 409);
      }

      // Create new credit balance
      const newBalance = await organisationCreditBalanceRepository.create(organisation_id, credit_balance);
      
      return responseHandler.success(res, newBalance, 'Organisation credit balance created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create organisation credit balance');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // List organisation balance (search by organisation name and website)
  async listOrganisationBalances(req, res, next) {
    try {
      const { organisation_name, website } = req.query;
      
      const searchParams = {};
      if (organisation_name) {
        searchParams.organisation_name = organisation_name;
      }
      if (website) {
        searchParams.website = website;
      }

      const balances = await organisationCreditBalanceRepository.findAll(searchParams);
      
      return responseHandler.success(res, balances, 'Organisation credit balances retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve organisation credit balances');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get credit balance for specific organisation
  async getCreditBalance(req, res, next) {
    try {
      const { organisation_id } = req.params;
      
      const balance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
      
      if (!balance) {
        return responseHandler.error(res, 'Credit balance not found for this organisation', 404);
      }
      
      return responseHandler.success(res, balance, 'Organisation credit balance retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve organisation credit balance');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // List organisation credit transactions by organisation id
  async listCreditTransactions(req, res, next) {
    try {
      const { organisation_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Validate limit and offset
      const parsedLimit = Math.min(parseInt(limit) || 50, 100); // Max 100 records per page
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const transactions = await organisationCreditTransactionRepository.findByOrganisationId(
        organisation_id, 
        parsedLimit, 
        parsedOffset
      );
      
      // Get total count for pagination
      const totalCount = await organisationCreditTransactionRepository.getTransactionCount(organisation_id);
      
      const result = {
        transactions,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: (parsedOffset + parsedLimit) < totalCount
        }
      };
      
      return responseHandler.success(res, result, 'Organisation credit transactions retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve organisation credit transactions');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Add credit transaction (Credit)
  async addCreditTransaction(req, res, next) {
    try {
      const { organisation_id, credit_amount, dollar_amount = null } = req.body;
      
      // Validate that dollar_amount is provided for credits
      if (dollar_amount === null || dollar_amount === undefined) {
        return responseHandler.error(res, 'Dollar amount is required for credit transactions', 400);
      }
      
      // Create credit transaction
      const transaction = await organisationCreditTransactionRepository.create({
        organisationId: organisation_id,
        transactionType: 'C',
        creditAmount: credit_amount,
        workflowId: null, // Credits don't have workflow_id
        dollarAmount: dollar_amount
      });
      
      // Update organisation credit balance
      const currentBalance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
      if (currentBalance) {
        const newBalance = currentBalance.credit_balance + credit_amount;
        await organisationCreditBalanceRepository.updateBalance(organisation_id, newBalance);
      } else {
        // Create balance if it doesn't exist
        await organisationCreditBalanceRepository.create(organisation_id, credit_amount);
      }
      
      return responseHandler.success(res, transaction, 'Credit transaction added successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to add credit transaction');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Add debit transaction (Debit)
  async addDebitTransaction(req, res, next) {
    try {
      const { organisation_id, credit_amount, workflow_id } = req.body;
      
      // Check if organisation has sufficient balance
      const currentBalance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
      if (!currentBalance) {
        return responseHandler.error(res, 'No credit balance found for this organisation', 404);
      }
      
      if (currentBalance.credit_balance < credit_amount) {
        return responseHandler.error(res, 'Insufficient credit balance', 400);
      }
      
      // Create debit transaction
      const transaction = await organisationCreditTransactionRepository.create({
        organisationId: organisation_id,
        transactionType: 'D',
        creditAmount: credit_amount,
        workflowId: workflow_id,
        dollarAmount: null // Debits don't have dollar_amount
      });
      
      // Update organisation credit balance
      const newBalance = currentBalance.credit_balance - credit_amount;
      await organisationCreditBalanceRepository.updateBalance(organisation_id, newBalance);
      
      return responseHandler.success(res, transaction, 'Debit transaction added successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to add debit transaction');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get transaction summary for organisation
  async getTransactionSummary(req, res, next) {
    try {
      const { organisation_id } = req.params;
      
      const [totalCredits, totalDebits, currentBalance] = await Promise.all([
        organisationCreditTransactionRepository.getTotalCredits(organisation_id),
        organisationCreditTransactionRepository.getTotalDebits(organisation_id),
        organisationCreditBalanceRepository.findByOrganisationId(organisation_id)
      ]);
      
      // Ensure we have valid numbers
      const totalCreditsValue = typeof totalCredits === 'number' ? totalCredits : 0;
      const totalDebitsValue = typeof totalDebits === 'number' ? totalDebits : 0;
      
      const summary = {
        organisation_id,
        current_balance: currentBalance ? currentBalance.credit_balance : 0,
        total_credits: totalCreditsValue,
        total_debits: totalDebitsValue,
        net_credits: totalCreditsValue - totalDebitsValue
      };
      
      return responseHandler.success(res, summary, 'Transaction summary retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve transaction summary');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new OrganisationCreditBalanceController();
