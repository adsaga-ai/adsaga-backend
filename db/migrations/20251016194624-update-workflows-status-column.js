'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add status column with enum values
    await queryInterface.addColumn('workflows', 'status', {
      type: Sequelize.ENUM('QUEUED', 'RUNNING', 'FINISHED'),
      allowNull: false,
      defaultValue: 'QUEUED'
    });

    // Remove is_running column
    await queryInterface.removeColumn('workflows', 'is_running');

    // Add index for status column for better performance
    await queryInterface.addIndex('workflows', ['status']);
  },

  async down (queryInterface, Sequelize) {
    // Add back is_running column
    await queryInterface.addColumn('workflows', 'is_running', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Remove status column
    await queryInterface.removeColumn('workflows', 'status');

    // Remove status index
    await queryInterface.removeIndex('workflows', ['status']);
  }
};
