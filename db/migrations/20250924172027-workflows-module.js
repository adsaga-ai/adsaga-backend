'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    await queryInterface.createTable('workflows', {
      workflow_id: {
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
      workflow_config_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workflow_config',
          key: 'workflow_config_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_running: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('workflows', ['organisation_id']);
    await queryInterface.addIndex('workflows', ['workflow_config_id']);
    await queryInterface.addIndex('workflows', ['is_running']);
    await queryInterface.addIndex('workflows', ['started_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflows');
  }
};