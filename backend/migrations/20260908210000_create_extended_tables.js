exports.up = async function (knex) {
  // Front office
  await knex.schema.createTable('admission_enquiries', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.string('phone', 50);
    t.string('email', 191);
    t.string('class', 191);
    t.string('enquiry_type', 191);
    t.text('message');
    t.string('status', 50).defaultTo('open');
    t.string('source', 191);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('complaints', (t) => {
    t.increments('id').primary();
    t.string('complainant_name', 191);
    t.string('complainant_type', 50);
    t.string('phone', 50);
    t.string('category', 191);
    t.text('description');
    t.string('status', 50).defaultTo('open');
    t.string('assigned_to', 191);
    t.date('date_reported');
    t.date('date_resolved');
    t.text('resolution_notes');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // Finance - income/expense
  await knex.schema.createTable('income_heads', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('incomes', (t) => {
    t.increments('id').primary();
    t.string('income_head', 191);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.date('date');
    t.text('description');
    t.string('payment_method', 50);
    t.string('reference', 191);
    t.string('received_by', 191);
    t.string('academic_year', 50);
    t.string('status', 50).defaultTo('completed');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('expense_heads', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('expenses', (t) => {
    t.increments('id').primary();
    t.string('expense_head', 191);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.date('date');
    t.text('description');
    t.string('payment_method', 50);
    t.string('reference', 191);
    t.string('paid_by', 191);
    t.string('academic_year', 50);
    t.string('status', 50).defaultTo('completed');
    t.string('attachment_url', 500);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // Academics
  await knex.schema.createTable('subject_groups', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.string('class_name', 191);
    t.text('subject_ids');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('departments', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('designations', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // Fee configuration
  await knex.schema.createTable('class_fee_structures', (t) => {
    t.increments('id').primary();
    t.integer('class_id');
    t.integer('section_id');
    t.integer('fee_head_id');
    t.decimal('amount', 12, 2).defaultTo(0);
    t.string('frequency', 50).defaultTo('once');
    t.string('academic_year', 50);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('student_fee_mappings', (t) => {
    t.increments('id').primary();
    t.integer('student_id');
    t.integer('fee_head_id');
    t.decimal('amount', 12, 2).defaultTo(0);
    t.string('due_date');
    t.string('status', 50).defaultTo('active');
    t.string('academic_year', 50);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('student_discounts', (t) => {
    t.increments('id').primary();
    t.integer('student_id');
    t.integer('fee_head_id');
    t.string('student_name', 191);
    t.decimal('discount_amount', 12, 2).defaultTo(0);
    t.string('discount_type', 50);
    t.text('description');
    t.string('academic_year', 50);
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // Exam configuration & reporting
  await knex.schema.createTable('grade_configurations', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.string('grade', 50);
    t.string('min_percentage', 50);
    t.string('max_percentage', 50);
    t.decimal('grade_point', 5, 2).defaultTo(0);
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('division_configurations', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.integer('min_percentage');
    t.integer('max_percentage');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('report_card_settings', (t) => {
    t.increments('id').primary();
    t.string('school_name', 191);
    t.text('header_text');
    t.text('footer_text');
    t.string('header_image_url', 500);
    t.string('signature_name', 191);
    t.string('signature_title', 191);
    t.boolean('show_teacher_remarks').defaultTo(true);
    t.boolean('show_student_remarks').defaultTo(true);
    t.boolean('show_division').defaultTo(true);
    t.boolean('show_percentage').defaultTo(true);
    t.boolean('show_grade').defaultTo(true);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // HR
  await knex.schema.createTable('leave_applications', (t) => {
    t.increments('id').primary();
    t.integer('staff_id');
    t.string('applicant_name', 191);
    t.string('leave_type', 50);
    t.date('start_date');
    t.date('end_date');
    t.text('reason');
    t.string('status', 50).defaultTo('pending');
    t.string('approver', 191);
    t.date('approval_date');
    t.text('approval_notes');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('leave_management_policies', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.string('leave_type', 50);
    t.integer('allowance_days').defaultTo(0);
    t.boolean('carry_forward').defaultTo(false);
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('payroll_records', (t) => {
    t.increments('id').primary();
    t.integer('staff_id');
    t.string('staff_name', 191);
    t.string('month', 50);
    t.string('year', 50);
    t.decimal('basic_salary', 12, 2).defaultTo(0);
    t.decimal('allowances', 12, 2).defaultTo(0);
    t.decimal('deductions', 12, 2).defaultTo(0);
    t.decimal('net_salary', 12, 2).defaultTo(0);
    t.string('payment_status', 50).defaultTo('pending');
    t.date('payment_date');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // Library
  await knex.schema.createTable('books', (t) => {
    t.increments('id').primary();
    t.string('title', 191).notNullable();
    t.string('author', 191);
    t.string('isbn', 50);
    t.string('category', 191);
    t.string('publisher', 191);
    t.integer('total_copies').defaultTo(1);
    t.integer('available_copies').defaultTo(1);
    t.string('shelf_location', 191);
    t.string('status', 50).defaultTo('available');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('book_issues', (t) => {
    t.increments('id').primary();
    t.integer('book_id');
    t.string('book_title', 191);
    t.integer('student_id');
    t.string('student_name', 191);
    t.date('issue_date');
    t.date('due_date');
    t.date('return_date');
    t.string('status', 50).defaultTo('issued');
    t.string('issued_by', 191);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // Inventory
  await knex.schema.createTable('inventory_items', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('category', 191);
    t.integer('quantity').defaultTo(0);
    t.string('unit', 50);
    t.string('supplier', 191);
    t.decimal('unit_price', 12, 2).defaultTo(0);
    t.string('location', 191);
    t.string('status', 50).defaultTo('in_stock');
    t.date('purchase_date');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('item_issues', (t) => {
    t.increments('id').primary();
    t.integer('item_id');
    t.string('item_name', 191);
    t.integer('quantity').defaultTo(1);
    t.integer('issued_to_id');
    t.string('issued_to_name', 191);
    t.string('issued_to_type', 50);
    t.date('issue_date');
    t.date('return_date');
    t.string('status', 50).defaultTo('issued');
    t.string('issued_by', 191);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // Transport
  await knex.schema.createTable('routes', (t) => {
    t.increments('id').primary();
    t.string('name', 191);
    t.text('description');
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('vehicles', (t) => {
    t.increments('id').primary();
    t.string('registration_number', 191).notNullable();
    t.string('vehicle_type', 50);
    t.integer('capacity').defaultTo(0);
    t.string('driver_name', 191);
    t.string('driver_phone', 50);
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // School events
  await knex.schema.createTable('school_events', (t) => {
    t.increments('id').primary();
    t.string('title', 191).notNullable();
    t.text('description');
    t.date('event_date');
    t.time('start_time');
    t.time('end_time');
    t.string('location', 191);
    t.string('category', 50);
    t.string('status', 50).defaultTo('scheduled');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const tables = [
    'school_events',
    'vehicles',
    'routes',
    'item_issues',
    'inventory_items',
    'book_issues',
    'books',
    'payroll_records',
    'leave_management_policies',
    'leave_applications',
    'report_card_settings',
    'division_configurations',
    'grade_configurations',
    'student_discounts',
    'student_fee_mappings',
    'class_fee_structures',
    'designations',
    'departments',
    'subject_groups',
    'expenses',
    'expense_heads',
    'incomes',
    'income_heads',
    'complaints',
    'admission_enquiries'
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
