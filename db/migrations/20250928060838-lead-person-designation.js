'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add designation field to lead_person table
    await queryInterface.addColumn('lead_person', 'designation', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Job title or designation of the person'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove designation field from lead_person table
    await queryInterface.removeColumn('lead_person', 'designation');
  }
};
