exports.up = function (knex) {
  return knex.schema.alterTable('admission_enquiries', function (t) {
    t.string('student_name', 191).nullable();
    t.string('enquiry_for_class', 191).nullable();
    t.string('current_school', 191).nullable();
    t.string('assigned_to_staff', 191).nullable();
    t.date('next_followup_date').nullable();
  }).then(function () {
    return knex('admission_enquiries').update({
      student_name: knex.raw('name'),
      enquiry_for_class: knex.raw('class')
    });
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('admission_enquiries', function (t) {
    t.dropColumn('student_name');
    t.dropColumn('enquiry_for_class');
    t.dropColumn('current_school');
    t.dropColumn('assigned_to_staff');
    t.dropColumn('next_followup_date');
  });
};