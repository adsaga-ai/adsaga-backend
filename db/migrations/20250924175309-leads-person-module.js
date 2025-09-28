'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    await queryInterface.createTable('lead_person', {
      lead_person_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'lead_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      person_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    await queryInterface.addIndex('lead_person', ['lead_id']);
    await queryInterface.addIndex('lead_person', ['email']);
    await queryInterface.addIndex('lead_person', ['is_verified']);
    await queryInterface.addIndex('lead_person', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lead_person');
  }
};