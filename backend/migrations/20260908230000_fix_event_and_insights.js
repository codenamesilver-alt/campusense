exports.up = async function (knex) {
  await knex.schema.table('school_events', (t) => {
    t.renameColumn('event_date', 'start_date');
    t.date('end_date');
    t.string('event_type', 50).defaultTo('event');
    t.boolean('is_all_day').defaultTo(true);
    t.string('applicable_to', 50).defaultTo('all');
    t.string('specific_class', 191);
    t.string('color', 20);
    t.string('academic_year', 50);
  });

  await knex.schema.createTable('student_attendance_insights', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.string('student_name', 191);
    t.string('class', 191);
    t.string('section', 191);
    t.integer('total_days_counted').defaultTo(0);
    t.integer('total_days_present').defaultTo(0);
    t.decimal('attendance_percentage', 8, 2).defaultTo(0);
    t.boolean('is_at_risk').defaultTo(false);
    t.string('academic_year', 50);
    t.date('last_calculated');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('student_attendance_insights');
  await knex.schema.table('school_events', (t) => {
    t.renameColumn('start_date', 'event_date');
    t.dropColumns('end_date', 'event_type', 'is_all_day', 'applicable_to', 'specific_class', 'color', 'academic_year');
  });
};