// File: db/migrations/20250125000000-email-verification-otp-module.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create user_email_verification table
    await queryInterface.createTable('user_email_verification', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      otp_code: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_user_created: {
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
    await queryInterface.addIndex('user_email_verification', ['email']);
    await queryInterface.addIndex('user_email_verification', ['expires_at']);
    await queryInterface.addIndex('user_email_verification', ['verified']);
  },

  async down(queryInterface, Sequelize) {
    // Drop the user_email_verification table
    await queryInterface.dropTable('user_email_verification');
  }
};