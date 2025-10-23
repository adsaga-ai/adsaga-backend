'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Increase precision for input_tokens_per_dollar and output_tokens_per_dollar
    // Change from DECIMAL(10, 4) to DECIMAL(15, 6) to handle larger values
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN input_tokens_per_dollar TYPE DECIMAL(15, 6);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN output_tokens_per_dollar TYPE DECIMAL(15, 6);
    `);
    
    // Increase precision for credits per token columns as well
    // Change from DECIMAL(10, 6) to DECIMAL(15, 10) for better precision
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN input_credits_per_token TYPE DECIMAL(15, 10);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN output_credits_per_token TYPE DECIMAL(15, 10);
    `);
  },

  async down (queryInterface, Sequelize) {
    // Revert back to original precision
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN input_tokens_per_dollar TYPE DECIMAL(10, 4);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN output_tokens_per_dollar TYPE DECIMAL(10, 4);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN input_credits_per_token TYPE DECIMAL(10, 6);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE models 
      ALTER COLUMN output_credits_per_token TYPE DECIMAL(10, 6);
    `);
  }
};
