const express = require('express');
const organisationCreditBalanceController = require('./organisation-credit-balance.controller');
const organisationCreditBalanceValidation = require('./organisation-credit-balance.validation');
const validate = require('../../middleware/validation-handler');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

// Create organisation credit balance (if already exists then error)
router.post(
  '/',
  adminAuth,
  validate(organisationCreditBalanceValidation.create),
  organisationCreditBalanceController.createCreditBalance
);

// List organisation balances (search by organisation name and website)
router.get(
  '/',
  adminAuth,
  validate(organisationCreditBalanceValidation.listBalances),
  organisationCreditBalanceController.listOrganisationBalances
);

// Get credit balance for specific organisation
router.get(
  '/:organisation_id',
  adminAuth,
  validate(organisationCreditBalanceValidation.getById),
  organisationCreditBalanceController.getCreditBalance
);

// List organisation credit transactions by organisation id
router.get(
  '/:organisation_id/transactions',
  adminAuth,
  validate(organisationCreditBalanceValidation.listTransactions),
  organisationCreditBalanceController.listCreditTransactions
);

// Get transaction summary for organisation
router.get(
  '/:organisation_id/summary',
  adminAuth,
  validate(organisationCreditBalanceValidation.getTransactionSummary),
  organisationCreditBalanceController.getTransactionSummary
);

// Add credit transaction (Credit)
router.post(
  '/:organisation_id/credit',
  adminAuth,
  validate(organisationCreditBalanceValidation.addCreditTransaction),
  organisationCreditBalanceController.addCreditTransaction
);

// Add debit transaction (Debit)
router.post(
  '/:organisation_id/debit',
  adminAuth,
  validate(organisationCreditBalanceValidation.addDebitTransaction),
  organisationCreditBalanceController.addDebitTransaction
);

module.exports = router;
