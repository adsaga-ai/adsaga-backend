'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('leads', 'assigned_to', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    });

    await queryInterface.addColumn('leads', 'assigned_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('leads', 'assigned_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('leads', 'assigned_to');
    await queryInterface.removeColumn('leads', 'assigned_at');
    await queryInterface.removeColumn('leads', 'assigned_by');
  }
};
