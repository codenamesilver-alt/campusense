exports.up = async function (knex) {
  await knex.schema.alterTable('incomes', (t) => {
    t.string('payment_mode', 50).nullable();
    t.string('income_head_name', 191).nullable();
    t.string('payer_name', 191).nullable();
    t.string('receipt_url', 500).nullable();
  });
  await knex.raw(`UPDATE incomes SET payment_mode = COALESCE(payment_mode, payment_method), income_head_name = COALESCE(income_head_name, income_head), payer_name = COALESCE(payer_name, received_by)`);

  await knex.schema.alterTable('expenses', (t) => {
    t.string('payment_mode', 50).nullable();
    t.string('expense_head_name', 191).nullable();
    t.string('paid_by_name', 191).nullable();
    t.string('receipt_url', 500).nullable();
  });
  await knex.raw(`UPDATE expenses SET payment_mode = COALESCE(payment_mode, payment_method), expense_head_name = COALESCE(expense_head_name, expense_head), paid_by_name = COALESCE(paid_by_name, paid_by)`);

  await knex.schema.alterTable('fee_heads', (t) => {
    t.string('fee_head_name', 191).nullable();
    t.string('frequency', 50).nullable().defaultTo('monthly');
    t.string('applicability', 50).nullable().defaultTo('compulsory');
    t.boolean('tax_applicable').nullable().defaultTo(false);
    t.decimal('tax_percentage', 5, 2).nullable().defaultTo(0);
    t.text('description').nullable();
  });
  await knex.raw(`UPDATE fee_heads SET fee_head_name = COALESCE(fee_head_name, name), frequency = COALESCE(frequency, 'monthly'), applicability = COALESCE(applicability, 'compulsory')`);

  await knex.schema.alterTable('fees_masters', (t) => {
    t.string('fees_group', 191).nullable();
    t.string('fees_type', 191).nullable();
    t.date('due_date').nullable();
  });

  await knex.schema.alterTable('fees_discounts', (t) => {
    t.integer('student_id').nullable();
    t.string('discount_code', 191).nullable();
    t.decimal('percentage', 12, 2).nullable();
    t.decimal('amount', 12, 2).nullable();
    t.string('duration_type', 50).nullable().defaultTo('onetime');
    t.date('applied_date').nullable();
  });

  await knex.schema.alterTable('item_issues', (t) => {
    t.date('expected_return_date').nullable();
  });
  await knex.raw(`UPDATE item_issues SET expected_return_date = COALESCE(expected_return_date, return_date)`);

  await knex.schema.alterTable('student_discounts', (t) => {
    t.date('valid_from').nullable();
    t.date('valid_to').nullable();
    t.string('discount_mode', 50).nullable();
    t.decimal('percentage', 12, 2).nullable();
    t.decimal('fixed_amount', 12, 2).nullable();
    t.text('reason').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('incomes', (t) => {
    t.dropColumn('payment_mode');
    t.dropColumn('income_head_name');
    t.dropColumn('payer_name');
    t.dropColumn('receipt_url');
  });
  await knex.schema.alterTable('expenses', (t) => {
    t.dropColumn('payment_mode');
    t.dropColumn('expense_head_name');
    t.dropColumn('paid_by_name');
    t.dropColumn('receipt_url');
  });
  await knex.schema.alterTable('fee_heads', (t) => {
    t.dropColumn('fee_head_name');
    t.dropColumn('frequency');
    t.dropColumn('applicability');
    t.dropColumn('tax_applicable');
    t.dropColumn('tax_percentage');
    t.dropColumn('description');
  });
  await knex.schema.alterTable('fees_masters', (t) => {
    t.dropColumn('fees_group');
    t.dropColumn('fees_type');
    t.dropColumn('due_date');
  });
  await knex.schema.alterTable('fees_discounts', (t) => {
    t.dropColumn('student_id');
    t.dropColumn('discount_code');
    t.dropColumn('percentage');
    t.dropColumn('amount');
    t.dropColumn('duration_type');
    t.dropColumn('applied_date');
  });
  await knex.schema.alterTable('item_issues', (t) => {
    t.dropColumn('expected_return_date');
  });
  await knex.schema.alterTable('student_discounts', (t) => {
    t.dropColumn('valid_from');
    t.dropColumn('valid_to');
    t.dropColumn('discount_mode');
    t.dropColumn('percentage');
    t.dropColumn('fixed_amount');
    t.dropColumn('reason');
  });
};