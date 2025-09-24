'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, create a workflow_config entry
    const workflowConfigId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    await queryInterface.bulkInsert('workflow_config', [
      {
        workflow_config_id: workflowConfigId,
        organisation_id: 'a658a432-1095-44d0-929c-4674cc22d657',
        domains: ['example.com', 'test.com', 'demo.org'],
        locations: ['New York', 'California', 'Texas'],
        designations: ['CEO', 'CTO', 'Marketing Manager', 'Sales Director'],
        runs_at: new Date('2025-01-25T10:00:00Z'),
        leads_count: 0,
        created_by: 'a581d3f7-3e43-4165-b11d-d89062cb9c1c',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Then, create workflow entries with manually generated UUIDs
    await queryInterface.bulkInsert('workflows', [
      {
        organisation_id: 'a658a432-1095-44d0-929c-4674cc22d657',
        workflow_config_id: workflowConfigId,
        is_running: false,
        started_at: null,
        finished_at: null
      },
      {
        organisation_id: 'a658a432-1095-44d0-929c-4674cc22d657',
        workflow_config_id: workflowConfigId,
        is_running: true,
        started_at: new Date('2025-01-25T09:30:00Z'),
        finished_at: null
      },
      {
        organisation_id: 'a658a432-1095-44d0-929c-4674cc22d657',
        workflow_config_id: workflowConfigId,
        is_running: false,
        started_at: new Date('2025-01-24T14:00:00Z'),
        finished_at: new Date('2025-01-24T16:30:00Z')
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove workflows first (due to foreign key constraints)
    await queryInterface.bulkDelete('workflows', {
      organisation_id: 'a658a432-1095-44d0-929c-4674cc22d657'
    });

    // Then remove workflow_config
    await queryInterface.bulkDelete('workflow_config', {
      organisation_id: 'a658a432-1095-44d0-929c-4674cc22d657'
    });
  }
};
