exports.up = function (knex) {
  return knex.schema.alterTable('student_houses', function (t) {
    t.string('house_name', 191).nullable();
  }).then(function () {
    return knex('student_houses').update({
      house_name: knex.raw('name')
    });
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('student_houses', function (t) {
    t.dropColumn('house_name');
  });
};