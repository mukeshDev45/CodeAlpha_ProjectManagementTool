const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'projectflow_fallback_jwt_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { generateToken };
