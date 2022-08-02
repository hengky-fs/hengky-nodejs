'use strict';

const { resetDb } = require('../../scripts/common');

exports.setupIntegrationTest = () => {
  const sequelize = require('../common/sequelize');
  beforeEach(resetDb);
  afterAll(() => sequelize.close());
};

exports.mockAwsSes = () => {
  jest.mock('aws-sdk', () => ({
    config: { update: () => {} },
    SES: jest.fn(() => ({
      sendEmail: jest.fn(() => ({
        promise: jest.fn().mockResolvedValue(true),
      })),
    })),
  }));
};

exports.mockSequelize = () => {
  jest.mock('../common/sequelize', () => ({
    define: jest.fn(),
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
  }));
};
