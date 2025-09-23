'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_config', {
      workflow_config_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      domains: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      locations: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      designations: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      runs_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      leads_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('workflow_config', ['organisation_id']);
    await queryInterface.addIndex('workflow_config', ['created_by']);
    await queryInterface.addIndex('workflow_config', ['runs_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflow_config');
  }
};