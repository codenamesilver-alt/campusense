exports.up = async function (knex) {
  // Late fee was introduced by the school in July 2026 for AY 2026-27. Dues dated
  // before this must not accrue. Stored as a setting so next session the admin moves
  // it to the academic-year start in the UI instead of shipping a code change.
  await knex.schema.alterTable('school_settings', (t) => {
    t.date('late_fee_effective_from').defaultTo('2026-07-01');
  });

  await knex('school_settings').whereNotNull('id').update({ late_fee_effective_from: '2026-07-01' });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('school_settings', (t) => {
    t.dropColumn('late_fee_effective_from');
  });
};