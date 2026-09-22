exports.up = async function (knex) {
  await knex.schema.createTable('approval_requests', (t) => {
    t.increments('id').primary();
    t.integer('transaction_id').notNullable();
    t.jsonb('changes').notNullable();
    t.text('reason').notNullable();
    t.integer('requested_by_user_id');
    t.string('requested_by_name', 191);
    t.string('status', 50).defaultTo('pending');
    t.string('approved_by_name', 191);
    t.text('admin_comment');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });
  await knex.raw(`
    ALTER TABLE approval_requests
    ADD CONSTRAINT approval_requests_transaction_fk
    FOREIGN KEY (transaction_id) REFERENCES fee_transactions(id)
  `);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE approval_requests DROP CONSTRAINT IF EXISTS approval_requests_transaction_fk`);
  await knex.schema.dropTableIfExists('approval_requests');
};