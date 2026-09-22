exports.up = async function (knex) {
  await knex.schema.alterTable('income_heads', (t) => {
    t.text('description');
  });

  await knex.schema.alterTable('expense_heads', (t) => {
    t.text('description');
  });

  await knex.schema.alterTable('class_fee_structures', (t) => {
    t.boolean('enabled').defaultTo(true);
    t.date('due_date');
  });

  await knex.schema.alterTable('report_card_settings', (t) => {
    t.string('school_logo_url', 500);
    t.text('school_address');
    t.string('school_phone', 191);
    t.string('school_website', 191);
    t.string('academic_session', 50);
    t.text('scholastic_grades');
    t.text('co_scholastic_grades');
    t.boolean('enable_principal_remarks').defaultTo(true);
    t.boolean('enable_teacher_remarks').defaultTo(true);
    t.string('principal_signature_label', 191);
    t.string('teacher_signature_label', 191);
    t.string('parent_signature_label', 191);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('income_heads', (t) => {
    t.dropColumn('description');
  });

  await knex.schema.alterTable('expense_heads', (t) => {
    t.dropColumn('description');
  });

  await knex.schema.alterTable('class_fee_structures', (t) => {
    t.dropColumn('enabled');
    t.dropColumn('due_date');
  });

  await knex.schema.alterTable('report_card_settings', (t) => {
    t.dropColumn('school_logo_url');
    t.dropColumn('school_address');
    t.dropColumn('school_phone');
    t.dropColumn('school_website');
    t.dropColumn('academic_session');
    t.dropColumn('scholastic_grades');
    t.dropColumn('co_scholastic_grades');
    t.dropColumn('enable_principal_remarks');
    t.dropColumn('enable_teacher_remarks');
    t.dropColumn('principal_signature_label');
    t.dropColumn('teacher_signature_label');
    t.dropColumn('parent_signature_label');
  });
};