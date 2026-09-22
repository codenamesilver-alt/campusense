exports.up = async function (knex) {
  const tables = await knex.raw(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  for (const { tablename } of tables.rows) {
    await knex.raw(`ALTER TABLE public."${tablename}" ENABLE ROW LEVEL SECURITY`);
  }
  await knex.raw('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated');
  await knex.raw('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated');
  await knex.raw('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated');
  await knex.raw('REVOKE USAGE ON SCHEMA public FROM anon, authenticated');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated');
};

exports.down = async function (knex) {
  const tables = await knex.raw(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  for (const { tablename } of tables.rows) {
    await knex.raw(`ALTER TABLE public."${tablename}" DISABLE ROW LEVEL SECURITY`);
  }
  await knex.raw('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated');
  await knex.raw('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated');
  await knex.raw('GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated');
  await knex.raw('GRANT USAGE ON SCHEMA public TO anon, authenticated');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated');
};