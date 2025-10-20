'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create organisation_invites table
    await queryInterface.createTable('organisation_invites', {
      invite_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      organisation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organisation', key: 'organisation_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      invited_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      invited_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('organisation_invites', ['organisation_id']);
    await queryInterface.addIndex('organisation_invites', ['invited_email']);
    await queryInterface.addIndex('organisation_invites', ['token']);
    await queryInterface.addIndex('organisation_invites', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organisation_invites');
  }
};


