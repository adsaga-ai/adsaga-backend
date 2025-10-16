'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add company_name, company_website, and custom_instructions columns to workflow_config table
    await queryInterface.addColumn('workflow_config', 'company_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Company name for the workflow configuration'
    });

    await queryInterface.addColumn('workflow_config', 'company_website', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Company website for the workflow configuration'
    });

    await queryInterface.addColumn('workflow_config', 'custom_instructions', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true,
      defaultValue: [],
      comment: 'Custom instructions array for the workflow configuration'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the added columns from workflow_config table
    await queryInterface.removeColumn('workflow_config', 'custom_instructions');
    await queryInterface.removeColumn('workflow_config', 'company_website');
    await queryInterface.removeColumn('workflow_config', 'company_name');
  }
};
