exports.up = async function (knex) {
  // FeeCollection sends `late_fine_waived` on every transaction. crud.js
  // stripUnknownColumns() drops keys absent from columnInfo(), so without this
  // column the waived amount was silently discarded and never persisted.
  await knex.schema.alterTable('fee_transactions', (t) => {
    t.decimal('late_fine_waived', 12, 2).defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('fee_transactions', (t) => {
    t.dropColumn('late_fine_waived');
  });
};
