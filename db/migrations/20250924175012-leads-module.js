'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    await queryInterface.createTable('leads', {
      lead_id: {
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
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workflows',
          key: 'workflow_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      company_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      company_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      company_locations: {
        type: Sequelize.ARRAY(Sequelize.STRING(255)),
        allowNull: true,
        defaultValue: []
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone_numbers: {
        type: Sequelize.ARRAY(Sequelize.STRING(20)),
        allowNull: true,
        defaultValue: []
      },
      emails: {
        type: Sequelize.ARRAY(Sequelize.STRING(255)),
        allowNull: true,
        defaultValue: []
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

    // Add indexes for better performance
    await queryInterface.addIndex('leads', ['organisation_id']);
    await queryInterface.addIndex('leads', ['workflow_id']);
    await queryInterface.addIndex('leads', ['company_name']);
    await queryInterface.addIndex('leads', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('leads');
  }
};