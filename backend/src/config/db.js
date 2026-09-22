require('dotenv').config();
const knex = require('knex');
const pg = require('pg');
const config = require('../../knexfile');

// DATE (OID 1082): return as 'YYYY-MM-DD' string instead of UTC-midnight JS Date,
// preventing the "-1 day" timezone shift when serialized to JSON on the client.
pg.types.setTypeParser(1082, (value) => value);

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env] || config.development);

module.exports = db;