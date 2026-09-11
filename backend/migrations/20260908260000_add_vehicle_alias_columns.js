exports.up = async function (knex) {
  await knex.schema.alterTable('vehicles', (t) => {
    t.string('vehicle_number', 191).nullable();
    t.string('model', 191).nullable();
    t.date('insurance_expiry').nullable();
  });
  await knex.raw(`UPDATE vehicles SET vehicle_number = COALESCE(vehicle_number, registration_number), model = COALESCE(model, vehicle_type)`);
};

exports.down = async function (knex) {
  await knex.schema.alterTable('vehicles', (t) => {
    t.dropColumn('vehicle_number');
    t.dropColumn('model');
    t.dropColumn('insurance_expiry');
  });
};