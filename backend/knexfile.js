require('dotenv').config();

const base = {
  client: 'pg',
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './src/seeds'
  },
  pool: { min: 0, max: 5 }
};

module.exports = {
  development: {
    ...base,
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
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
      ssl: { rejectUnauthorized: false }
    }
  }
};
