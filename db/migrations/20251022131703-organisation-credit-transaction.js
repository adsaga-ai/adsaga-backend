'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create organisation_credit_transactions table
    await queryInterface.createTable('organisation_credit_transactions', {
      transaction_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      organisation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organisation',
          key: 'organisation_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      model_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'models',
          key: 'model_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      transaction_type: {
        type: Sequelize.ENUM('C', 'D'),
        allowNull: false,
        comment: 'C=Credit, D=Debit'
      },
      credit_amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'workflows',
          key: 'workflow_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Only for debits'
      },
      dollar_amount: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Only for credits (purchases)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('organisation_credit_transactions', ['organisation_id']);
    await queryInterface.addIndex('organisation_credit_transactions', ['transaction_type']);
    await queryInterface.addIndex('organisation_credit_transactions', ['created_at']);
    await queryInterface.addIndex('organisation_credit_transactions', ['model_id']);
    await queryInterface.addIndex('organisation_credit_transactions', ['workflow_id']);
  },

  async down (queryInterface, Sequelize) {
    // Drop the organisation_credit_transactions table
    await queryInterface.dropTable('organisation_credit_transactions');
  }
};