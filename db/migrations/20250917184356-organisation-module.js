'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create organisation table
    await queryInterface.createTable('organisation', {
      organisation_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
