exports.up = async function (knex) {
  await knex.schema.alterTable('admission_enquiries', (t) => {
    t.date('date_of_enquiry').nullable();
  });
  await knex.schema.alterTable('complaints', (t) => {
    t.date('date').nullable();
    t.string('complaint_type').nullable();
    t.string('complaint_by').nullable();
    t.text('action_taken').nullable();
    t.text('note').nullable();
    t.string('attachment_url').nullable();
  });
  await knex.schema.alterTable('incomes', (t) => {
    t.date('date_of_transaction').nullable();
  });
  await knex.schema.alterTable('expenses', (t) => {
    t.date('date_of_expense').nullable();
  });
  await knex.schema.alterTable('leave_applications', (t) => {
    t.string('applicant_type').notNullable().defaultTo('staff');
  });

  await knex.raw(`UPDATE admission_enquiries SET date_of_enquiry = COALESCE(date_of_enquiry, created_date)`);
  await knex.raw(`UPDATE complaints SET date = COALESCE(date, date_reported), complaint_type = COALESCE(complaint_type, category), complaint_by = COALESCE(complaint_by, complainant_type)`);
  await knex.raw(`UPDATE incomes SET date_of_transaction = COALESCE(date_of_transaction, date, created_date)`);
  await knex.raw(`UPDATE expenses SET date_of_expense = COALESCE(date_of_expense, date, created_date)`);
};

exports.down = async function (knex) {
  await knex.schema.alterTable('admission_enquiries', (t) => {
    t.dropColumn('date_of_enquiry');
  });
  await knex.schema.alterTable('complaints', (t) => {
    t.dropColumn('date');
    t.dropColumn('complaint_type');
    t.dropColumn('complaint_by');
    t.dropColumn('action_taken');
    t.dropColumn('note');
    t.dropColumn('attachment_url');
  });
  await knex.schema.alterTable('incomes', (t) => {
    t.dropColumn('date_of_transaction');
  });
  await knex.schema.alterTable('expenses', (t) => {
    t.dropColumn('date_of_expense');
  });
  await knex.schema.alterTable('leave_applications', (t) => {
    t.dropColumn('applicant_type');
  });
};