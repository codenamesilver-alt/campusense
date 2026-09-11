const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  await knex('role_permissions').del();
  await knex('school_settings').del();
  await knex('users').del();
  await knex('sessions').del();
  await knex('subjects').del();
  await knex('sections').del();
  await knex('classes').del();
  await knex('students').del();
  await knex('notices').del();

  const password_hash = await bcrypt.hash('admin123', 10);
  await knex('users').insert({
    email: 'admin@campusense.com',
    password_hash,
    first_name: 'Admin',
    last_name: 'User',
    phone: '0000000000',
    role: 'admin',
    status: 'active'
  });

  await knex('school_settings').insert({
    school_name: 'Campusense School',
    address: '123 Main Street',
    phone: '0000000000',
    email: 'admin@campusense.com',
    allow_backdated_receipt: false
  });

  await knex('sessions').insert([
    { name: '2026-27', start_date: '2026-04-01', end_date: '2027-03-31', is_current: true },
    { name: '2025-26', start_date: '2025-04-01', end_date: '2026-03-31', is_current: false }
  ]);

  await knex('classes').insert([
    { name: 'Class 1', numeric_value: 1 },
    { name: 'Class 2', numeric_value: 2 },
    { name: 'Class 3', numeric_value: 3 },
    { name: 'Class 4', numeric_value: 4 },
    { name: 'Class 5', numeric_value: 5 },
    { name: 'Class 6', numeric_value: 6 },
    { name: 'Class 7', numeric_value: 7 },
    { name: 'Class 8', numeric_value: 8 },
    { name: 'Class 9', numeric_value: 9 },
    { name: 'Class 10', numeric_value: 10 }
  ]);

  await knex('sections').insert([
    { name: 'A' },
    { name: 'B' },
    { name: 'C' }
  ]);

  await knex('subjects').insert([
    { name: 'Mathematics', code: 'MATH', type: 'scholastic' },
    { name: 'English', code: 'ENG', type: 'scholastic' },
    { name: 'Science', code: 'SCI', type: 'scholastic' },
    { name: 'Hindi', code: 'HIN', type: 'scholastic' },
    { name: 'Social Studies', code: 'SST', type: 'scholastic' },
    { name: 'Computer Science', code: 'CS', type: 'scholastic' },
    { name: 'Physical Education', code: 'PE', type: 'co-scholastic' },
    { name: 'Art', code: 'ART', type: 'co-scholastic' }
  ]);

  const demoStudents = [
    ['STU-0001', 'Aarav', 'Sharma', 'Class 5', 'A', 'father_01'],
    ['STU-0002', 'Diya', 'Patel', 'Class 5', 'A', 'father_02'],
    ['STU-0003', 'Rohan', 'Verma', 'Class 5', 'B', 'father_03'],
    ['STU-0004', 'Isha', 'Singh', 'Class 6', 'A', 'father_04'],
    ['STU-0005', 'Kabir', 'Khan', 'Class 7', 'C', 'father_05'],
  ];

  for (let i = 0; i < demoStudents.length; i++) {
    const [adm, first, last, cls, sec, _] = demoStudents[i];
    await knex('students').insert({
      admission_number: adm,
      first_name: first,
      last_name: last,
      date_of_birth: `2014-0${i + 1}-10`,
      gender: i % 2 === 0 ? 'male' : 'female',
      class: cls,
      section: sec,
      roll_number: String(i + 1),
      father_name: `${first}'s Father`,
      mother_name: `${first}'s Mother`,
      guardian_phone: `98765432${i}0`,
      guardian_email: `parent${i + 1}@example.com`,
      address: `${i + 1} Marine Drive, Mumbai`,
      blood_group: 'O+',
      house: 'Blue',
      admission_date: '2026-04-05',
      aadhaar_number: `12341234123${i}`,
      academic_year: '2026-27',
      is_new_admission: true,
      status: 'active'
    });
  }

  await knex('notices').insert([
    {
      title: 'Welcome to the new academic session 2026-27',
      content: 'School reopens on 5th April. All students should report by 8:00 AM.',
      category: 'general',
      target_audience: 'all',
      priority: 'high',
      publish_date: '2026-04-01',
      expiry_date: '2026-06-30',
      status: 'published',
      pinned: true
    },
    {
      title: 'First Unit Test Schedule',
      content: 'Unit Test 1 will begin on 15th June. Check exam section for the full schedule.',
      category: 'exam',
      target_audience: 'students',
      priority: 'medium',
      publish_date: '2026-06-01',
      expiry_date: '2026-07-15',
      status: 'published',
      pinned: false
    }
  ]);

  await knex('role_permissions').insert([
    { role: 'admin', permissions: JSON.stringify(['*']) },
    { role: 'teacher', permissions: JSON.stringify(['students:view', 'attendance:mark', 'attendance:view', 'exam:results', 'exam:view', 'timetable:view', 'notices:view', 'notices:create', 'reports:view']) },
    { role: 'student', permissions: JSON.stringify(['students:view', 'attendance:view', 'exam:view', 'notices:view', 'fees:view']) },
    { role: 'accountant', permissions: JSON.stringify(['students:view', 'fees:collect', 'fees:view', 'income:manage', 'expense:manage', 'reports:view']) },
    { role: 'principal', permissions: JSON.stringify(['students:view', 'staff:view', 'attendance:view', 'exam:view', 'reports:view', 'notices:create', 'timetable:view']) }
  ]);
};