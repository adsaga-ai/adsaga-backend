'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create organisation_location table
    await queryInterface.createTable('organisation_location', {
      location_id: {
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
      address: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(50),
        allowNull: false
      }
    });

    // Add index on organisation_id for better query performance
    await queryInterface.addIndex('organisation_location', ['organisation_id']);
  },

  async down (queryInterface, Sequelize) {
    // Drop the organisation_location table
    await queryInterface.dropTable('organisation_location');
  }
};
