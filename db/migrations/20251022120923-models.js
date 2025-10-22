'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create enum for model_type
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_model_type AS ENUM ('LLM', 'EMBEDDING', 'VISION', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'IMAGE_GENERATION');
    `);
    
    // Create models table with merged pricing and conversion data
    await queryInterface.createTable('models', {
      model_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      model_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      model_type: {
        type: Sequelize.ENUM('LLM', 'EMBEDDING', 'VISION', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'IMAGE_GENERATION'),
        allowNull: false
      },
      input_tokens_per_dollar: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Input tokens per dollar pricing'
      },
      output_tokens_per_dollar: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Output tokens per dollar pricing'
      },
      input_credits_per_token: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        comment: 'Input credits per token conversion rate'
      },
      output_credits_per_token: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        comment: 'Output credits per token conversion rate'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Add index on model_type for better query performance
    await queryInterface.addIndex('models', ['model_type']);
  },

  async down (queryInterface, Sequelize) {
    // Drop the models table
    await queryInterface.dropTable('models');
    
    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_model_type;');
  }
};