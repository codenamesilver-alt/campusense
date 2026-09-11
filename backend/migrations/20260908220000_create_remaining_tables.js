exports.up = async function (knex) {
  await knex.schema.createTable('staff_attendances', (t) => {
    t.increments('id').primary();
    t.integer('staff_id');
    t.string('staff_name', 191);
    t.date('date');
    t.string('status', 50).defaultTo('present');
    t.string('marked_by', 191);
    t.text('remarks');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('holidays', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.date('date');
    t.string('type', 50).defaultTo('holiday');
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('fees_groups', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('fees_types', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.integer('fees_group_id');
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('fees_masters', (t) => {
    t.increments('id').primary();
    t.integer('fees_group_id');
    t.integer('fees_type_id');
    t.string('class', 191);
    t.string('section', 191);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.string('academic_year', 50);
    t.string('frequency', 50).defaultTo('once');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('fees_discounts', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.string('discount_type', 50).defaultTo('percentage');
    t.decimal('discount_value', 12, 2).defaultTo(0);
    t.string('status', 50).defaultTo('active');
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('fees_payments', (t) => {
    t.increments('id').primary();
    t.integer('student_id');
    t.string('student_name', 191);
    t.string('payment_method', 50);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.date('payment_date');
    t.string('receipt_number', 191);
    t.string('transaction_id', 191);
    t.string('status', 50).defaultTo('completed');
    t.string('academic_year', 50);
    t.text('remarks');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('class_teacher_assignments', (t) => {
    t.increments('id').primary();
    t.integer('class_id');
    t.integer('section_id');
    t.integer('teacher_id');
    t.string('class_name', 191);
    t.string('section_name', 191);
    t.string('academic_year', 50);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('item_categories', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('item_suppliers', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('contact_person', 191);
    t.string('phone', 50);
    t.string('email', 191);
    t.text('address');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('student_houses', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('house_color', 50);
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('student_transports', (t) => {
    t.increments('id').primary();
    t.integer('student_id');
    t.string('student_name', 191);
    t.integer('route_id');
    t.string('route_name', 191);
    t.integer('vehicle_id');
    t.string('stop_name', 191);
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('email_templates', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('subject', 191);
    t.text('body');
    t.string('category', 50);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sms_templates', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.text('body');
    t.string('category', 50);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const tables = [
    'sms_templates',
    'email_templates',
    'student_transports',
    'student_houses',
    'item_suppliers',
    'item_categories',
    'class_teacher_assignments',
    'fees_payments',
    'fees_discounts',
    'fees_masters',
    'fees_types',
    'fees_groups',
    'holidays',
    'staff_attendances'
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};