require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    client: process.env.DB_CLIENT || 'sqlite', // 'sqlite' or 'postgres'
    sqlitePath: process.env.SQLITE_PATH || './employeehub.db',
    connectionString: process.env.DATABASE_URL || ''
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'employeehub_dev_secret_key_change_in_production_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10)
  }
};

// Validate production requirements
function validateConfig() {
  if (config.env === 'production') {
    if (config.jwt.secret === 'employeehub_dev_secret_key_change_in_production_2026') {
      throw new Error('SECURITY WARNING: Default JWT_SECRET cannot be used in production.');
    }
  }
}

module.exports = {
  config,
  validateConfig
};
