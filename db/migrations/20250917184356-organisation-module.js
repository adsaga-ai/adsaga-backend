'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create organisation table
    await queryInterface.createTable('organisation', {
      organisation_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      organisation_name: {
        type: Sequelize.STRING(25),
        allowNull: false
      },
      website: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      subscription_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
        references: {
          model: 'subscription_type',
          key: 'subscription_code'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add index on subscription_code for better query performance
    await queryInterface.addIndex('organisation', ['subscription_code']);
  },

  async down (queryInterface, Sequelize) {
    // Drop the organisation table
    await queryInterface.dropTable('organisation');
  }
};
