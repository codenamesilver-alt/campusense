exports.up = async function (knex) {
  // users table (auth)
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email', 191).notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('first_name', 191);
    t.string('last_name', 191);
    t.string('phone', 50);
    t.string('role', 50).defaultTo('admin');
    t.string('staff_id', 191);
    t.string('status', 50).defaultTo('active');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // staff table
  await knex.schema.createTable('staff', (t) => {
    t.increments('id').primary();
    t.string('staff_id', 191).notNullable();
    t.string('first_name', 191).notNullable();
    t.string('last_name', 191).notNullable();
    t.string('email', 191);
    t.string('phone', 50);
    t.string('role', 50);
    t.string('department', 191);
    t.string('designation', 191);
    t.date('date_of_birth');
    t.string('gender', 20);
    t.text('address');
    t.date('joining_date');
    t.decimal('salary', 12, 2);
    t.string('status', 50).defaultTo('active');
    t.string('photo_url', 500);
    t.string('pan_number', 50);
    t.string('pf_number', 50);
    t.string('aadhaar_number', 50);
    t.string('bank_account_number', 50);
    t.string('ifsc_code', 50);
    t.string('bank_name', 191);
    t.decimal('basic_salary', 12, 2).defaultTo(0);
    t.decimal('hra', 12, 2).defaultTo(0);
    t.decimal('transport_allowance', 12, 2).defaultTo(0);
    t.decimal('other_allowance', 12, 2).defaultTo(0);
    t.decimal('gross_salary', 12, 2).defaultTo(0);
    t.decimal('pf_deduction', 12, 2).defaultTo(0);
    t.decimal('tax_deduction', 12, 2).defaultTo(0);
    t.decimal('other_deduction', 12, 2).defaultTo(0);
    t.decimal('net_salary', 12, 2).defaultTo(0);
    t.string('employment_type', 50).defaultTo('probation');
    t.integer('paid_leave_balance').defaultTo(0);
    t.integer('sick_leave_balance').defaultTo(0);
    t.integer('casual_leave_balance').defaultTo(0);
    t.integer('maternity_leave_balance').defaultTo(0);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // classes table
  await knex.schema.createTable('classes', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.integer('numeric_value').notNullable();
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // sections table
  await knex.schema.createTable('sections', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // subjects table
  await knex.schema.createTable('subjects', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('code', 191).notNullable();
    t.string('type', 50).defaultTo('scholastic');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // students table
  await knex.schema.createTable('students', (t) => {
    t.increments('id').primary();
    t.string('admission_number', 191);
    t.string('first_name', 191).notNullable();
    t.string('last_name', 191);
    t.date('date_of_birth');
    t.string('gender', 20);
    t.string('class', 191);
    t.string('section', 191);
    t.string('roll_number', 50);
    t.string('father_name', 191);
    t.string('mother_name', 191);
    t.string('guardian_phone', 50);
    t.string('guardian_email', 191);
    t.text('address');
    t.string('blood_group', 10);
    t.string('house', 191);
    t.date('admission_date');
    t.string('aadhaar_number', 50);
    t.string('academic_year', 50);
    t.boolean('is_new_admission').defaultTo(false);
    t.string('status', 50).defaultTo('active');
    t.string('photo_url', 500);
    t.string('disable_reason', 500);
    t.date('disabled_date');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // timetables table
  await knex.schema.createTable('timetables', (t) => {
    t.increments('id').primary();
    t.integer('class_id').notNullable();
    t.integer('section_id').notNullable();
    t.string('day_of_week', 30).notNullable();
    t.integer('period_number').notNullable();
    t.string('start_time', 20);
    t.string('end_time', 20);
    t.integer('subject_id').notNullable();
    t.integer('teacher_id').notNullable();
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // attendances table
  await knex.schema.createTable('attendances', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.date('date').notNullable();
    t.string('class', 191);
    t.string('section', 191);
    t.string('status', 50).notNullable();
    t.string('marked_by', 191);
    t.text('remarks');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.index(['student_id', 'date']);
    t.unique(['student_id', 'class', 'section', 'date']);
  });

  // fee_heads table
  await knex.schema.createTable('fee_heads', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('fee_type', 50);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // fee_dues table
  await knex.schema.createTable('fee_dues', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.string('fee_type', 50);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.decimal('paid_amount', 12, 2).defaultTo(0);
    t.decimal('balance_amount', 12, 2).defaultTo(0);
    t.date('due_date');
    t.string('status', 50).defaultTo('pending');
    t.string('academic_year', 50);
    t.text('remarks');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // fee_transactions table
  await knex.schema.createTable('fee_transactions', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.string('receipt_number', 191);
    t.date('transaction_date').notNullable();
    t.string('payment_mode', 50).notNullable();
    t.decimal('total_amount', 12, 2).notNullable();
    t.decimal('discount_amount', 12, 2).defaultTo(0);
    t.decimal('late_fine', 12, 2).defaultTo(0);
    t.decimal('tax_amount', 12, 2).defaultTo(0);
    t.decimal('net_amount', 12, 2).notNullable();
    t.text('fee_details');
    t.string('payment_reference', 191);
    t.string('collected_by', 191);
    t.text('remarks');
    t.string('academic_year', 50);
    t.string('status', 50).defaultTo('completed');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // fees table
  await knex.schema.createTable('fees', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.string('fee_type', 50);
    t.decimal('amount', 12, 2).defaultTo(0);
    t.date('due_date');
    t.date('paid_date');
    t.string('status', 50).defaultTo('pending');
    t.decimal('discount', 12, 2).defaultTo(0);
    t.string('payment_method', 50);
    t.string('receipt_number', 191);
    t.text('remarks');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // exam_groups table
  await knex.schema.createTable('exam_groups', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('exam_type', 191);
    t.string('academic_session', 191);
    t.text('description');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // exam_schedules table
  await knex.schema.createTable('exam_schedules', (t) => {
    t.increments('id').primary();
    t.integer('exam_group_id').notNullable();
    t.string('class', 191);
    t.string('section', 191);
    t.string('subject_name', 191);
    t.date('exam_date');
    t.string('meeting_slot', 50);
    t.string('start_time', 20);
    t.string('end_time', 20);
    t.string('invigilator', 191);
    t.integer('max_marks');
    t.integer('passing_marks');
    t.string('room_no', 50);
    t.string('academic_session', 191);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // exam_results table
  await knex.schema.createTable('exam_results', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.string('student_name', 191);
    t.integer('exam_schedule_id');
    t.integer('exam_group_id');
    t.string('exam_group_name', 191);
    t.integer('subject_id');
    t.string('subject_name', 191);
    t.string('class', 191);
    t.string('section', 191);
    t.integer('max_marks').defaultTo(100);
    t.decimal('marks_obtained', 12, 2);
    t.decimal('percentage', 12, 2);
    t.string('grade', 20);
    t.text('remarks');
    t.string('attendance_status', 50).defaultTo('present');
    t.string('academic_session', 191);
    t.boolean('is_published').defaultTo(false);
    t.string('status', 50).defaultTo('entered');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // student_results table
  await knex.schema.createTable('student_results', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable();
    t.string('student_name', 191);
    t.integer('exam_group_id');
    t.string('exam_group_name', 191);
    t.integer('subject_id');
    t.string('subject_name', 191);
    t.string('class', 191);
    t.string('section', 191);
    t.integer('max_marks').defaultTo(100);
    t.decimal('marks_obtained', 12, 2);
    t.decimal('percentage', 12, 2);
    t.string('grade', 20);
    t.text('remarks');
    t.string('academic_session', 191);
    t.boolean('is_published').defaultTo(false);
    t.string('status', 50).defaultTo('entered');
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // notices table
  await knex.schema.createTable('notices', (t) => {
    t.increments('id').primary();
    t.string('title', 191).notNullable();
    t.text('content').notNullable();
    t.string('category', 50).notNullable();
    t.string('target_audience', 50).notNullable();
    t.string('specific_class', 191);
    t.string('priority', 50).defaultTo('medium');
    t.date('publish_date');
    t.date('expiry_date');
    t.string('status', 50).defaultTo('draft');
    t.string('attachment_url', 500);
    t.boolean('pinned').defaultTo(false);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // school_settings table
  await knex.schema.createTable('school_settings', (t) => {
    t.increments('id').primary();
    t.string('school_name', 191).notNullable();
    t.text('address');
    t.string('phone', 50);
    t.string('email', 191);
    t.string('logo_url', 500);
    t.string('header_image_url', 500);
    t.integer('current_session_id');
    t.boolean('allow_backdated_receipt').defaultTo(false);
    t.timestamp('created_date').defaultTo(knex.fn.now());
    t.timestamp('updated_date').defaultTo(knex.fn.now());
  });

  // sessions table
  await knex.schema.createTable('sessions', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.date('start_date');
    t.date('end_date');
    t.boolean('is_current').defaultTo(false);
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });

  // role_permissions table
  await knex.schema.createTable('role_permissions', (t) => {
    t.increments('id').primary();
    t.string('role', 191).notNullable();
    t.text('permissions');
    t.timestamp('created_date').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const tables = [
    'role_permissions',
    'sessions',
    'school_settings',
    'notices',
    'student_results',
    'exam_results',
    'exam_schedules',
    'exam_groups',
    'fees',
    'fee_transactions',
    'fee_dues',
    'fee_heads',
    'attendances',
    'timetables',
    'students',
    'subjects',
    'sections',
    'classes',
    'staff',
    'users'
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
