'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, add all columns as nullable
    await queryInterface.sequelize.query(`
      ALTER TABLE public.subscription_type 
      ADD COLUMN input_tokens_included bigint DEFAULT 0,
      ADD COLUMN output_tokens_included bigint DEFAULT 0,
      ADD COLUMN monthly_price decimal(10,2),
      ADD COLUMN currency varchar(3) DEFAULT 'USD',
      ADD COLUMN token_rollover_enabled bool DEFAULT true,
      ADD COLUMN max_rollover_percentage decimal(5,2) DEFAULT 100.00,
      ADD COLUMN is_active bool DEFAULT true,
      ADD COLUMN updated_at timestamptz DEFAULT NOW();  
    `);

    // Update existing rows with default values for monthly_price
    await queryInterface.sequelize.query(`
      UPDATE public.subscription_type 
      SET monthly_price = 0.00 
      WHERE monthly_price IS NULL;
    `);

    // Now make the columns NOT NULL
    await queryInterface.sequelize.query(`
      ALTER TABLE public.subscription_type 
      ALTER COLUMN input_tokens_included SET NOT NULL,
      ALTER COLUMN output_tokens_included SET NOT NULL,
      ALTER COLUMN monthly_price SET NOT NULL,
      ALTER COLUMN currency SET NOT NULL,
      ALTER COLUMN token_rollover_enabled SET NOT NULL,
      ALTER COLUMN max_rollover_percentage SET NOT NULL,
      ALTER COLUMN is_active SET NOT NULL,
      ALTER COLUMN updated_at SET NOT NULL;
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.subscription_type 
      DROP COLUMN input_tokens_included,
      DROP COLUMN output_tokens_included,
      DROP COLUMN monthly_price,
      DROP COLUMN currency,
      DROP COLUMN token_rollover_enabled,
      DROP COLUMN max_rollover_percentage,
      DROP COLUMN is_active,
      DROP COLUMN updated_at;
    `);
  }
};
