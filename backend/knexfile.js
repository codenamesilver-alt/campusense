require('dotenv').config();

const pgOptions = {
  ssl: { rejectUnauthorized: false },
  statement_timeout: 20000,
  query_timeout: 20000,
  connectionTimeoutMillis: 10000
};

const base = {
  client: 'pg',
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './src/seeds'
  },
  pool: { min: 1, max: 10 },
  acquireConnectionTimeout: 15000
};

module.exports = {
  development: {
    ...base,
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ...pgOptions
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'campusense',
        }
  },
  production: {
    ...base,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ...pgOptions
    }
  }
};
