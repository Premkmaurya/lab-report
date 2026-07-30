const test = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');
const { validateUpdateUserStatus } = require('../src/validators/auth.validator');

function runValidation(req) {
  const res = {};
  const next = () => {};

  for (const middleware of validateUpdateUserStatus) {
    middleware(req, res, next);
  }

  return validationResult(req);
}

test('accepts a status-based permission update payload', () => {
  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    body: {
      status: true,
      permissions: ['manage_tests'],
    },
  };

  const result = runValidation(req);

  assert.equal(result.isEmpty(), true, result.array().map((err) => err.msg).join(', '));
});

test('accepts an isAuthorized-based payload as an alias', () => {
  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    body: {
      isAuthorized: false,
      permissions: ['manage_doctors'],
    },
  };

  const result = runValidation(req);

  assert.equal(result.isEmpty(), true, result.array().map((err) => err.msg).join(', '));
});
