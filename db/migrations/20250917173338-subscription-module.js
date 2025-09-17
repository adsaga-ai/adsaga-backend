'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_type', {
      subscription_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        primaryKey: true
      },
      subscription_name: {
        type: Sequelize.STRING(25),
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('subscription_type');
  }
};
