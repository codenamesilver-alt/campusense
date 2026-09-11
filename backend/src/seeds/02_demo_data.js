exports.seed = async function (knex) {
  const owned = [
    'departments', 'designations', 'staff', 'staff_attendances', 'income_heads',
    'expense_heads', 'incomes', 'expenses', 'fees_groups', 'fees_types', 'fees_masters',
    'fees_discounts', 'fee_heads', 'class_fee_structures', 'student_fee_mappings',
    'fee_dues', 'fees_payments', 'exam_groups', 'exam_schedules', 'exam_results',
    'student_results', 'attendances', 'timetables', 'routes', 'vehicles',
    'student_transports', 'books', 'book_issues', 'item_categories', 'item_suppliers',
    'inventory_items', 'item_issues', 'school_events', 'holidays',
    'class_teacher_assignments', 'student_houses', 'leave_applications',
    'payroll_records', 'student_attendance_insights', 'admission_enquiries', 'complaints'
  ];
  for (const t of owned) {
    await knex(t).del();
  }

  const today = new Date();
  const iso = (d) => d.toISOString().split('T')[0];
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const datetimeWithinMonth = () => {
    const d = new Date(today);
    if (d.getDate() > 20) d.setDate(12);
    else if (d.getDate() < 5) d.setDate(20);
    return iso(d);
  };

  await knex('departments').insert([
    { name: 'Academics' },
    { name: 'Administration' },
    { name: 'Accounts' },
    { name: 'Transport' }
  ]);

  await knex('designations').insert([
    { name: 'Principal' },
    { name: 'Teacher' },
    { name: 'Accountant' },
    { name: 'Driver' },
    { name: 'Librarian' }
  ]);

  const staffRows = [
    { staff_id: 'STAFF-001', first_name: 'Meera', last_name: 'Iyer', email: 'meera@campusense.com', phone: '9812345601', role: 'teacher', department: 'Academics', designation: 'Teacher', date_of_birth: '1985-03-12', gender: 'female', joining_date: '2019-06-01', salary: 45000, basic_salary: 32000, hra: 8000, transport_allowance: 2000, other_allowance: 3000, gross_salary: 45000, pf_deduction: 3600, tax_deduction: 1200, other_deduction: 500, net_salary: 39700, employment_type: 'permanent', paid_leave_balance: 12, sick_leave_balance: 8, casual_leave_balance: 6, status: 'active' },
    { staff_id: 'STAFF-002', first_name: 'Arjun', last_name: 'Nair', email: 'arjun@campusense.com', phone: '9812345602', role: 'teacher', department: 'Academics', designation: 'Teacher', date_of_birth: '1990-07-25', gender: 'male', joining_date: '2021-06-01', salary: 38000, basic_salary: 27000, hra: 6000, transport_allowance: 1500, other_allowance: 3500, gross_salary: 38000, pf_deduction: 3040, tax_deduction: 800, other_deduction: 400, net_salary: 33760, employment_type: 'permanent', paid_leave_balance: 12, sick_leave_balance: 8, casual_leave_balance: 5, status: 'active' },
    { staff_id: 'STAFF-003', first_name: 'Sneha', last_name: 'Reddy', email: 'sneha@campusense.com', phone: '9812345603', role: 'teacher', department: 'Academics', designation: 'Teacher', date_of_birth: '1995-11-03', gender: 'female', joining_date: '2023-06-01', salary: 32000, basic_salary: 23000, hra: 5000, transport_allowance: 1000, other_allowance: 3000, gross_salary: 32000, pf_deduction: 2560, tax_deduction: 500, other_deduction: 300, net_salary: 28640, employment_type: 'probation', paid_leave_balance: 10, sick_leave_balance: 6, casual_leave_balance: 6, status: 'active' },
    { staff_id: 'STAFF-004', first_name: 'Rajesh', last_name: 'Gupta', email: 'rajesh@campusense.com', phone: '9812345604', role: 'accountant', department: 'Accounts', designation: 'Accountant', date_of_birth: '1980-01-30', gender: 'male', joining_date: '2018-06-01', salary: 40000, basic_salary: 30000, hra: 6000, transport_allowance: 1500, other_allowance: 2500, gross_salary: 40000, pf_deduction: 3200, tax_deduction: 1000, other_deduction: 400, net_salary: 35400, employment_type: 'permanent', paid_leave_balance: 15, sick_leave_balance: 8, casual_leave_balance: 8, status: 'active' },
    { staff_id: 'STAFF-005', first_name: 'Balu', last_name: 'Kumar', email: 'balu@campusense.com', phone: '9812345605', role: 'driver', department: 'Transport', designation: 'Driver', date_of_birth: '1975-06-18', gender: 'male', joining_date: '2017-06-01', salary: 22000, basic_salary: 16500, hra: 2500, transport_allowance: 1000, other_allowance: 2000, gross_salary: 22000, pf_deduction: 1760, tax_deduction: 200, other_deduction: 200, net_salary: 19840, employment_type: 'permanent', paid_leave_balance: 12, sick_leave_balance: 8, casual_leave_balance: 6, status: 'active' },
    { staff_id: 'STAFF-006', first_name: 'Kavya', last_name: 'Menon', email: 'kavya@campusense.com', phone: '9812345606', role: 'librarian', department: 'Administration', designation: 'Librarian', date_of_birth: '1988-09-21', gender: 'female', joining_date: '2020-06-01', salary: 28000, basic_salary: 20000, hra: 4000, transport_allowance: 1000, other_allowance: 3000, gross_salary: 28000, pf_deduction: 2240, tax_deduction: 400, other_deduction: 300, net_salary: 25060, employment_type: 'permanent', paid_leave_balance: 12, sick_leave_balance: 8, casual_leave_balance: 6, status: 'active' }
  ];
  await knex('staff').insert(staffRows);

  const staffIds = {};
  for (const s of await knex('staff').select('id', 'staff_id', 'first_name', 'last_name')) {
    staffIds[s.staff_id] = s.id;
  }
  const teacher = ['STAFF-001', 'STAFF-002', 'STAFF-003'];
  const teacherNames = {
    'STAFF-001': 'Meera Iyer',
    'STAFF-002': 'Arjun Nair',
    'STAFF-003': 'Sneha Reddy'
  };

  await knex('income_heads').insert([
    { name: 'School Fee Collection', status: 'active' },
    { name: 'Government Grant', status: 'active' },
    { name: 'Donations', status: 'active' },
    { name: 'Transport Fee', status: 'active' }
  ]);

  await knex('expense_heads').insert([
    { name: 'Salaries', status: 'active' },
    { name: 'Electricity', status: 'active' },
    { name: 'Stationery', status: 'active' },
    { name: 'Maintenance', status: 'active' },
    { name: 'Transport Fuel', status: 'active' }
  ]);

  await knex('incomes').insert([
    { income_head: 'School Fee Collection', income_head_name: 'School Fee Collection', amount: 250000, date: daysAgo(5), date_of_transaction: daysAgo(5), description: 'Monthly fee collection', payment_method: 'cash', payment_mode: 'cash', received_by: 'Rajesh Gupta', payer_name: 'Rajesh Gupta', academic_year: '2026-27', status: 'received' },
    { income_head: 'Transport Fee', income_head_name: 'Transport Fee', amount: 45000, date: daysAgo(8), date_of_transaction: daysAgo(8), description: 'Bus fee collection', payment_method: 'cash', payment_mode: 'cash', received_by: 'Rajesh Gupta', payer_name: 'Rajesh Gupta', academic_year: '2026-27', status: 'received' },
    { income_head: 'Government Grant', income_head_name: 'Government Grant', amount: 100000, date: daysAgo(12), date_of_transaction: daysAgo(12), description: 'Quarterly grant', payment_method: 'bank_transfer', payment_mode: 'bank_transfer', received_by: 'Rajesh Gupta', payer_name: 'Govt of Maharashtra', academic_year: '2026-27', status: 'received' },
    { income_head: 'Donations', income_head_name: 'Donations', amount: 20000, date: daysAgo(3), date_of_transaction: daysAgo(3), description: 'Alumni donation', payment_method: 'upi', payment_mode: 'upi', received_by: 'Rajesh Gupta', payer_name: 'Alumni Association', academic_year: '2026-27', status: 'received' }
  ]);

  await knex('expenses').insert([
    { expense_head: 'Salaries', expense_head_name: 'Salaries', amount: 240000, date: daysAgo(4), date_of_expense: daysAgo(4), description: 'Staff salaries for September', payment_method: 'bank_transfer', payment_mode: 'bank_transfer', paid_by: 'Rajesh Gupta', paid_by_name: 'Rajesh Gupta', academic_year: '2026-27', status: 'paid' },
    { expense_head: 'Electricity', expense_head_name: 'Electricity', amount: 15000, date: daysAgo(7), date_of_expense: daysAgo(7), description: 'Monthly electricity bill', payment_method: 'cash', payment_mode: 'cash', paid_by: 'Rajesh Gupta', paid_by_name: 'Rajesh Gupta', academic_year: '2026-27', status: 'paid' },
    { expense_head: 'Stationery', expense_head_name: 'Stationery', amount: 8000, date: daysAgo(10), date_of_expense: daysAgo(10), description: 'Printer paper and supplies', payment_method: 'cash', payment_mode: 'cash', paid_by: 'Rajesh Gupta', paid_by_name: 'Rajesh Gupta', academic_year: '2026-27', status: 'paid' },
    { expense_head: 'Transport Fuel', expense_head_name: 'Transport Fuel', amount: 12500, date: daysAgo(2), date_of_expense: daysAgo(2), description: 'Bus diesel', payment_method: 'cash', payment_mode: 'cash', paid_by: 'Balu Kumar', paid_by_name: 'Balu Kumar', academic_year: '2026-27', status: 'paid' }
  ]);

  await knex('fees_groups').insert([
    { name: 'Academic Fees', description: 'Tuition and exam fees' },
    { name: 'Transport Fees', description: 'Bus fee collection' }
  ]);
  const fr = await knex('fees_groups').select('id', 'name');
  const groupIds = {};
  for (const g of fr) groupIds[g.name] = g.id;

  await knex('fees_types').insert([
    { name: 'Tuition Fee', fees_group_id: groupIds['Academic Fees'], description: 'Monthly tuition' },
    { name: 'Exam Fee', fees_group_id: groupIds['Academic Fees'], description: 'Per exam' },
    { name: 'Bus Charge', fees_group_id: groupIds['Transport Fees'], description: 'Monthly transport' },
    { name: 'Lab Fee', fees_group_id: groupIds['Academic Fees'], description: 'Annual lab charges' }
  ]);

  const feesTypeIds = {};
  for (const t of await knex('fees_types').select('id', 'name')) feesTypeIds[t.name] = t.id;

  await knex('fees_masters').insert([
    { fees_group_id: groupIds['Academic Fees'], fees_type_id: feesTypeIds['Tuition Fee'], fees_group: 'Academic Fees', fees_type: 'Tuition Fee', class: 'Class 5', section: 'A', amount: 3000, academic_year: '2026-27', frequency: 'monthly', due_date: '2026-09-10' },
    { fees_group_id: groupIds['Academic Fees'], fees_type_id: feesTypeIds['Exam Fee'], fees_group: 'Academic Fees', fees_type: 'Exam Fee', class: 'Class 5', section: 'A', amount: 1000, academic_year: '2026-27', frequency: 'once', due_date: '2026-09-15' },
    { fees_group_id: groupIds['Academic Fees'], fees_type_id: feesTypeIds['Lab Fee'], fees_group: 'Academic Fees', fees_type: 'Lab Fee', class: 'Class 5', section: 'A', amount: 2500, academic_year: '2026-27', frequency: 'once', due_date: '2026-09-20' },
    { fees_group_id: groupIds['Academic Fees'], fees_type_id: feesTypeIds['Tuition Fee'], fees_group: 'Academic Fees', fees_type: 'Tuition Fee', class: 'Class 6', section: 'A', amount: 3200, academic_year: '2026-27', frequency: 'monthly', due_date: '2026-09-10' }
  ]);

  await knex('fees_discounts').insert([
    { name: 'Sibling Discount', discount_type: 'percentage', discount_value: 10, status: 'active', description: '10% for siblings' },
    { name: 'Merit Scholarship', discount_type: 'percentage', discount_value: 25, status: 'active', description: 'Top performers' },
    { student_id: 1, discount_code: 'SIB10', discount_type: 'percentage', percentage: 10, duration_type: 'permanent', applied_date: daysAgo(15), status: 'active' },
    { student_id: 2, discount_code: 'MERIT25', discount_type: 'percentage', percentage: 25, duration_type: 'permanent', applied_date: daysAgo(12), status: 'active' }
  ]);

  await knex('fee_heads').insert([
    { name: 'Tuition', fee_head_name: 'Tuition', fee_type: 'monthly', amount: 3000, frequency: 'monthly', applicability: 'compulsory', tax_applicable: false, description: 'Monthly tuition fees' },
    { name: 'Examination', fee_head_name: 'Examination', fee_type: 'once', amount: 1000, frequency: 'once', applicability: 'compulsory', tax_applicable: false, description: 'Exam fee per exam' },
    { name: 'Laboratory', fee_head_name: 'Laboratory', fee_type: 'once', amount: 2500, frequency: 'once', applicability: 'compulsory', tax_applicable: true, tax_percentage: 5, description: 'Annual lab charges' }
  ]);

  const class5 = await knex('classes').where({ name: 'Class 5' }).first();
  const class6 = await knex('classes').where({ name: 'Class 6' }).first();
  const secA = await knex('sections').where({ name: 'A' }).first();
  const secB = await knex('sections').where({ name: 'B' }).first();
  const secC = await knex('sections').where({ name: 'C' }).first();

  const feeHeads = await knex('fee_heads').select('id', 'name');
  const feeHeadIds = {};
  for (const f of feeHeads) feeHeadIds[f.name] = f.id;

  await knex('class_fee_structures').insert([
    { class_id: class5.id, section_id: secA.id, fee_head_id: feeHeadIds['Tuition'], amount: 3000, frequency: 'monthly', academic_year: '2026-27' },
    { class_id: class5.id, section_id: secA.id, fee_head_id: feeHeadIds['Examination'], amount: 1000, frequency: 'once', academic_year: '2026-27' }
  ]);

  const students = await knex('students').select('id', 'admission_number', 'first_name', 'last_name', 'class', 'section');
  const studentById = {};
  const studentName = {};
  for (const s of students) {
    studentById[s.id] = s;
    studentName[s.id] = `${s.first_name} ${s.last_name}`;
  }
  const studentIds = students.map((s) => s.id);
  const class5Students = students.filter((s) => s.class === 'Class 5' && s.section === 'A').map((s) => s.id);

  await knex('student_fee_mappings').insert(
    studentIds.map((sid, i) => ({
      student_id: sid,
      fee_head_id: feeHeadIds[i % 2 === 0 ? 'Tuition' : 'Examination'],
      amount: i % 2 === 0 ? 3000 : 1000,
      due_date: iso(new Date()),
      status: i < 3 ? 'paid' : 'active',
      academic_year: '2026-27'
    }))
  );

  await knex('fee_dues').insert(
    studentIds.map((sid, i) => ({
      student_id: sid,
      fee_type: 'Tuition',
      amount: 3000,
      paid_amount: i < 3 ? 3000 : 1500,
      balance_amount: i < 3 ? 0 : 1500,
      due_date: iso(new Date()),
      status: i < 3 ? 'paid' : 'partial',
      academic_year: '2026-27'
    }))
  );

  await knex('fees_payments').insert([
    { student_id: studentIds[0], student_name: studentName[studentIds[0]], payment_method: 'cash', amount: 3000, payment_date: daysAgo(5), receipt_number: 'RCP-1001', transaction_id: 'TXN-1001', status: 'completed', academic_year: '2026-27' },
    { student_id: studentIds[1], student_name: studentName[studentIds[1]], payment_method: 'upi', amount: 3000, payment_date: daysAgo(3), receipt_number: 'RCP-1002', transaction_id: 'TXN-1002', status: 'completed', academic_year: '2026-27' },
    { student_id: studentIds[2], student_name: studentName[studentIds[2]], payment_method: 'bank_transfer', amount: 1500, payment_date: daysAgo(1), receipt_number: 'RCP-1003', transaction_id: 'TXN-1003', status: 'partial', academic_year: '2026-27' }
  ]);

  await knex('exam_groups').insert([
    { name: 'Unit Test 1', exam_type: 'unit_test', academic_session: '2026-27', description: 'First unit test' },
    { name: 'Half Yearly', exam_type: 'term', academic_session: '2026-27', description: 'Term exam' }
  ]);
  const examGroups = await knex('exam_groups').select('id', 'name');
  const examGroupIds = {};
  for (const e of examGroups) examGroupIds[e.name] = e.id;

  const subjects = await knex('subjects').select('id', 'name');
  const subjectIds = {};
  for (const s of subjects) subjectIds[s.name] = s.id;

  const examSubjects = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies'];
  const scheduleRows = [];
  for (let i = 0; i < examSubjects.length; i++) {
    scheduleRows.push({
      exam_group_id: examGroupIds['Unit Test 1'],
      class: 'Class 5',
      section: 'A',
      subject_name: examSubjects[i],
      exam_date: iso(new Date(new Date().setDate(new Date().getDate() + i + 30))),
      start_time: '09:00',
      end_time: '11:00',
      invigilator: teacherNames[teacher[i % 3]],
      max_marks: 100,
      passing_marks: 40,
      room_no: `Room-1`,
      academic_session: '2026-27'
    });
  }
  await knex('exam_schedules').insert(scheduleRows);

  const scheduRows = await knex('exam_schedules').where('class', 'Class 5').select('id', 'subject_name');
  const examResults = [];
  for (const sid of class5Students) {
    for (const sch of scheduRows) {
      const marks = Math.round(55 + Math.random() * 40);
      examResults.push({
        student_id: sid,
        student_name: studentName[sid],
        exam_schedule_id: sch.id,
        exam_group_id: examGroupIds['Unit Test 1'],
        exam_group_name: 'Unit Test 1',
        subject_id: subjectIds[sch.subject_name],
        subject_name: sch.subject_name,
        class: 'Class 5',
        section: 'A',
        max_marks: 100,
        marks_obtained: marks,
        percentage: marks,
        grade: marks >= 75 ? 'A' : marks >= 60 ? 'B' : 'C',
        academic_session: '2026-27',
        is_published: 1,
        status: 'published'
      });
    }
  }
  await knex('exam_results').insert(examResults);
  await knex('student_results').insert(
    examResults.map(({ exam_schedule_id, ...rest }) => rest)
  );

  const attendanceRows = [];
  const statuses = ['present', 'present', 'absent', 'present', 'present', 'late', 'present', 'absent', 'present', 'present'];
  for (let d = 1; d <= 10; d++) {
    for (let i = 0; i < studentIds.length; i++) {
      attendanceRows.push({
        student_id: studentIds[i],
        date: daysAgo(d),
        class: studentById[studentIds[i]].class,
        section: studentById[studentIds[i]].section,
        status: statuses[(i + d) % statuses.length],
        marked_by: teacherNames['STAFF-001'],
        remarks: ''
      });
    }
  }
  await knex('attendances').insert(attendanceRows);

  const staffAttendanceRows = [];
  for (let d = 1; d <= 6; d++) {
    for (const sid of Object.keys(staffIds)) {
      staffAttendanceRows.push({
        staff_id: staffIds[sid],
        staff_name: `${staffRows.find((r) => r.staff_id === sid).first_name} ${staffRows.find((r) => r.staff_id === sid).last_name}`,
        date: daysAgo(d),
        status: 'present',
        marked_by: 'Admin'
      });
    }
  }
  await knex('staff_attendances').insert(staffAttendanceRows);

  const periodTimes = [['08:00', '08:45'], ['08:45', '09:30'], ['09:30', '10:15'], ['10:30', '11:15'], ['11:15', '12:00'], ['12:00', '12:45']];
  const timetableRows = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periodSubject = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science'];
  for (let d = 0; d < days.length; d++) {
    for (let p = 0; p < 6; p++) {
      timetableRows.push({
        class_id: class5.id,
        section_id: secA.id,
        day_of_week: days[d],
        period_number: p + 1,
        start_time: periodTimes[p][0],
        end_time: periodTimes[p][1],
        subject_id: subjectIds[periodSubject[(d + p) % 6]],
        teacher_id: staffIds[teacher[(d + p) % 3]]
      });
    }
  }
  await knex('timetables').insert(timetableRows);

  await knex('routes').insert([
    { name: 'Route 1 - Marine Drive', description: 'Morning and evening pickup', fee: 1500, status: 'active' },
    { name: 'Route 2 - Bandra', description: 'Morning and evening pickup', fee: 1200, status: 'active' }
  ]);
  const routes = await knex('routes').select('id', 'name');
  const routeIds = {};
  for (const r of routes) routeIds[r.name] = r.id;

  await knex('vehicles').insert([
    { registration_number: 'MH01AB1234', vehicle_number: 'MH01AB1234', vehicle_type: 'bus', model: 'Tata Starbus', capacity: 40, driver_name: 'Balu Kumar', driver_phone: '9812345605', insurance_expiry: '2027-06-30', status: 'active' },
    { registration_number: 'MH02CD5678', vehicle_number: 'MH02CD5678', vehicle_type: 'van', model: 'Force Tempo Traveller', capacity: 16, driver_name: '', driver_phone: '', insurance_expiry: '2027-03-15', status: 'active' }
  ]);
  const vehicles = await knex('vehicles').select('id', 'registration_number');
  const vehicleIds = {};
  for (const v of vehicles) vehicleIds[v.registration_number] = v.id;

  await knex('student_transports').insert([
    { student_id: studentIds[0], student_name: studentName[studentIds[0]], route_id: routeIds['Route 1 - Marine Drive'], route_name: 'Route 1 - Marine Drive', vehicle_id: vehicleIds['MH01AB1234'], stop_name: 'Marine Drive Stop', fee: 1500, status: 'active' },
    { student_id: studentIds[1], student_name: studentName[studentIds[1]], route_id: routeIds['Route 2 - Bandra'], route_name: 'Route 2 - Bandra', vehicle_id: vehicleIds['MH02CD5678'], stop_name: 'Bandra Stop', fee: 1200, status: 'active' }
  ]);

  await knex('books').insert([
    { title: 'Mathematics for Class 5', author: 'R.D. Sharma', isbn: '978-81-231-0001-0', category: 'textbook', publisher: 'Dhanpat Rai', total_copies: 20, available_copies: 18, shelf_location: 'A-1', status: 'available' },
    { title: 'Science Class 5', author: 'NCERT', isbn: '978-81-7450-001-0', category: 'textbook', publisher: 'NCERT', total_copies: 25, available_copies: 24, shelf_location: 'B-2', status: 'available' },
    { title: 'English Reader', author: 'Oxford', isbn: '978-81-9000-015-0', category: 'textbook', publisher: 'Oxford', total_copies: 15, available_copies: 15, shelf_location: 'C-3', status: 'available' },
    { title: 'Panchatantra Stories', author: 'Vishnu Sharma', isbn: '978-81-8999-100-0', category: 'story', publisher: 'Puffin', total_copies: 10, available_copies: 9, shelf_location: 'D-4', status: 'available' },
    { title: 'World Atlas', author: 'DK', isbn: '978-81-7777-900-0', category: 'reference', publisher: 'DK', total_copies: 5, available_copies: 5, shelf_location: 'E-5', status: 'available' }
  ]);
  const books = await knex('books').select('id', 'title');
  const bookIds = {};
  for (const b of books) bookIds[b.title] = b.id;

  await knex('book_issues').insert([
    { book_id: bookIds['Panchatantra Stories'], book_title: 'Panchatantra Stories', student_id: studentIds[3], student_name: studentName[studentIds[3]], issue_date: daysAgo(9), due_date: daysAgo(-5), status: 'issued', issued_by: 'Kavya Menon' },
    { book_id: bookIds['Mathematics for Class 5'], book_title: 'Mathematics for Class 5', student_id: studentIds[4], student_name: studentName[studentIds[4]], issue_date: daysAgo(7), due_date: daysAgo(-3), status: 'issued', issued_by: 'Kavya Menon' }
  ]);

  await knex('item_categories').insert([
    { name: 'Furniture', description: 'Desks, chairs, tables' },
    { name: 'Stationery', description: 'Paper, pens, registers' },
    { name: 'Sports', description: 'Sports equipment' }
  ]);

  await knex('item_suppliers').insert([
    { name: 'Aarav Supplies', contact_person: 'Mohan', phone: '9822000101', email: 'mohan@aaravsupplies.com', address: 'Mumbai' },
    { name: 'United Traders', contact_person: 'Suresh', phone: '9822000102', email: 'suresh@unitedtraders.com', address: 'Mumbai' }
  ]);

  await knex('inventory_items').insert([
    { name: 'Student Chair', category: 'Furniture', quantity: 120, unit: 'pcs', supplier: 'Aarav Supplies', unit_price: 850, location: 'Store A', status: 'in_stock', purchase_date: daysAgo(20) },
    { name: 'A4 Paper Ream', category: 'Stationery', quantity: 50, unit: 'ream', supplier: 'United Traders', unit_price: 320, location: 'Store B', status: 'in_stock', purchase_date: daysAgo(10) },
    { name: 'Basketball', category: 'Sports', quantity: 20, unit: 'pcs', supplier: 'United Traders', unit_price: 650, location: 'Store C', status: 'in_stock', purchase_date: daysAgo(15) },
    { name: 'Marker Pens', category: 'Stationery', quantity: 10, unit: 'box', supplier: 'United Traders', unit_price: 480, location: 'Store B', status: 'low_stock', purchase_date: daysAgo(6) }
  ]);
  const items = await knex('inventory_items').select('id', 'name');
  const itemIds = {};
  for (const it of items) itemIds[it.name] = it.id;

  await knex('item_issues').insert([
    { item_id: itemIds['Basketball'], item_name: 'Basketball', quantity: 2, issued_to_id: studentIds[2], issued_to_name: studentName[studentIds[2]], issued_to_type: 'student', issue_date: daysAgo(4), expected_return_date: daysAgo(-3), status: 'issued', issued_by: 'Meera Iyer' }
  ]);

  await knex('school_events').insert([
    { title: 'Annual Day', description: 'Annual cultural program', start_date: iso(new Date(new Date().setDate(new Date().getDate() + 45))), start_time: '17:00:00', end_time: '20:00:00', location: 'School Auditorium', category: 'cultural', status: 'scheduled', event_type: 'event', is_all_day: 0, applicable_to: 'all', color: '#ef4444', academic_year: '2026-27' },
    { title: 'Science Exhibition', description: 'Student science projects', start_date: iso(new Date(new Date().setDate(new Date().getDate() + 60))), start_time: '09:00:00', end_time: '13:00:00', location: 'Main Hall', category: 'academic', status: 'scheduled', event_type: 'event', is_all_day: 0, applicable_to: 'all', color: '#3b82f6', academic_year: '2026-27' },
    { title: 'Sports Day', description: 'Annual sports meet', start_date: iso(new Date(new Date().setDate(new Date().getDate() + 80))), start_time: '08:00:00', end_time: '16:00:00', location: 'Ground', category: 'sports', status: 'scheduled', event_type: 'event', is_all_day: 0, applicable_to: 'all', color: '#22c55e', academic_year: '2026-27' },
    { title: 'Parent Teacher Meeting', description: 'Quarterly PTM', start_date: datetimeWithinMonth(), end_time: '11:00:00', location: 'Classrooms', category: 'meeting', status: 'scheduled', event_type: 'meeting', is_all_day: 0, applicable_to: 'all', color: '#8b5cf6', academic_year: '2026-27' }
  ]);

  await knex('admission_enquiries').insert([
    { name: 'Riya Kapoor', student_name: 'Riya Kapoor', phone: '9876500011', email: 'riya.kapoor@example.com', class: 'Class 5', enquiry_for_class: 'Class 5', enquiry_type: 'admission', message: 'Wants admission for daughter in Class 5.', status: 'open', source: 'website', date_of_enquiry: daysAgo(3) },
    { name: 'Vikram Malhotra', student_name: 'Vikram Malhotra', phone: '9876500022', email: 'vikram@example.com', class: 'Class 8', enquiry_for_class: 'Class 8', enquiry_type: 'admission', message: 'Inquiry about fee structure for Class 8.', status: 'open', source: 'walk_in', date_of_enquiry: daysAgo(2) },
    { name: 'Priya Desai', student_name: 'Priya Desai', phone: '9876500033', email: 'priya@example.com', class: 'Class 5', enquiry_for_class: 'Class 5', enquiry_type: 'transfer', message: 'Transfer from another school, needs Class 5 seat.', status: 'contacted', source: 'referral', date_of_enquiry: daysAgo(6) }
  ]);

  await knex('complaints').insert([
    { complaint_type: 'Infrastructure', complaint_by: 'Vikram Malhotra', phone: '9876500022', date: daysAgo(4), description: 'Broken tap in ground floor washroom', action_taken: 'Logged for maintenance', assigned_to: 'Balu Kumar', note: '', category: 'Infrastructure', complainant_type: 'parent', complainant_name: 'Vikram Malhotra', date_reported: daysAgo(4), status: 'open' },
    { complaint_type: 'Academic', complaint_by: 'Sneha Reddy', phone: '9812345603', date: daysAgo(2), description: 'Class 5 B projector not working', action_taken: '', assigned_to: '', note: '', category: 'Academic', complainant_type: 'staff', complainant_name: 'Sneha Reddy', date_reported: daysAgo(2), status: 'in_progress' },
    { complaint_type: 'Transport', complaint_by: 'Riya Kapoor', phone: '9876500011', date: daysAgo(1), description: 'Bus delay in the morning route', action_taken: 'Driver informed', assigned_to: 'Balu Kumar', note: 'Resolved after driver confirmation', category: 'Transport', complainant_type: 'parent', complainant_name: 'Riya Kapoor', date_reported: daysAgo(1), status: 'resolved' }
  ]);

  await knex('holidays').insert([
    { name: 'Independence Day', date: '2026-08-15', type: 'national', description: 'National holiday' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'national', description: 'National holiday' },
    { name: 'Diwali Break', date: '2026-11-10', type: 'festival', description: 'Festival break' },
    { name: 'Summer Vacation', date: '2026-05-20', type: 'vacation', description: 'Summer break start' }
  ]);

  await knex('class_teacher_assignments').insert([
    { class_id: class5.id, section_id: secA.id, teacher_id: staffIds['STAFF-001'], class_name: 'Class 5', section_name: 'A', academic_year: '2026-27' },
    { class_id: class5.id, section_id: secB.id, teacher_id: staffIds['STAFF-002'], class_name: 'Class 5', section_name: 'B', academic_year: '2026-27' },
    { class_id: class6.id, section_id: secA.id, teacher_id: staffIds['STAFF-003'], class_name: 'Class 6', section_name: 'A', academic_year: '2026-27' }
  ]);

  await knex('student_discounts').insert([
    { student_id: studentIds[0], student_name: studentName[studentIds[0]], fee_head_id: feeHeadIds['Tuition'], discount_amount: 300, discount_type: 'sibling', discount_mode: 'percentage', percentage: 10, description: 'Sibling discount', reason: 'Sibling studying in same school', academic_year: '2026-27', status: 'active', valid_from: '2026-04-01', valid_to: '2027-03-31' },
    { student_id: studentIds[1], student_name: studentName[studentIds[1]], fee_head_id: feeHeadIds['Tuition'], discount_amount: 750, discount_type: 'merit', discount_mode: 'percentage', percentage: 25, description: 'Merit scholarship', reason: 'Class topper previous year', academic_year: '2026-27', status: 'active', valid_from: '2026-04-01', valid_to: '2027-03-31' },
    { student_id: studentIds[2], student_name: studentName[studentIds[2]], fee_head_id: feeHeadIds['Tuition'], discount_amount: 500, discount_type: 'staff', discount_mode: 'fixed', fixed_amount: 500, description: 'Staff ward discount', reason: 'Parent is a staff member', academic_year: '2026-27', status: 'approved', valid_from: '2026-04-01', valid_to: '2027-03-31' }
  ]);

  await knex('student_houses').insert([
    { name: 'Blue House', house_color: '#3b82f6', description: 'Sports house' },
    { name: 'Green House', house_color: '#22c55e', description: 'Sports house' },
    { name: 'Red House', house_color: '#ef4444', description: 'Sports house' },
    { name: 'Yellow House', house_color: '#eab308', description: 'Sports house' }
  ]);

  await knex('leave_applications').insert([
    { staff_id: staffIds['STAFF-002'], applicant_name: 'Arjun Nair', leave_type: 'sick', start_date: iso(new Date(new Date().setDate(new Date().getDate() + 5))), end_date: iso(new Date(new Date().setDate(new Date().getDate() + 6))), reason: 'Fever', status: 'pending', applicant_type: 'staff' },
    { staff_id: staffIds['STAFF-003'], applicant_name: 'Sneha Reddy', leave_type: 'casual', start_date: iso(new Date(new Date().setDate(new Date().getDate() + 8))), end_date: iso(new Date(new Date().setDate(new Date().getDate() + 8))), reason: 'Personal work', status: 'pending', applicant_type: 'staff' },
    { staff_id: staffIds['STAFF-005'], applicant_name: 'Balu Kumar', leave_type: 'casual', start_date: daysAgo(12), end_date: daysAgo(12), reason: 'Family function', status: 'approved', approver: 'Admin', approval_date: daysAgo(14), approval_notes: 'Approved', applicant_type: 'staff' }
  ]);

  await knex('payroll_records').insert([
    { staff_id: staffIds['STAFF-001'], staff_name: 'Meera Iyer', month: 'August', year: '2026', basic_salary: 32000, allowances: 13000, deductions: 5300, net_salary: 39700, payment_status: 'paid', payment_date: daysAgo(6) },
    { staff_id: staffIds['STAFF-002'], staff_name: 'Arjun Nair', month: 'August', year: '2026', basic_salary: 27000, allowances: 11000, deductions: 4240, net_salary: 33760, payment_status: 'paid', payment_date: daysAgo(6) },
    { staff_id: staffIds['STAFF-003'], staff_name: 'Sneha Reddy', month: 'August', year: '2026', basic_salary: 23000, allowances: 9000, deductions: 3360, net_salary: 28640, payment_status: 'paid', payment_date: daysAgo(6) },
    { staff_id: staffIds['STAFF-004'], staff_name: 'Rajesh Gupta', month: 'August', year: '2026', basic_salary: 30000, allowances: 10000, deductions: 4600, net_salary: 35400, payment_status: 'pending', payment_date: null }
  ]);

  await knex('student_attendance_insights').insert(
    studentIds.map((sid, i) => ({
      student_id: sid,
      student_name: studentName[sid],
      class: studentById[sid].class,
      section: studentById[sid].section,
      total_days_counted: 10,
      total_days_present: 10 - i,
      attendance_percentage: (10 - i) * 10,
      is_at_risk: i >= 3,
      academic_year: '2026-27',
      last_calculated: today
    }))
  );

  await knex('subject_groups').insert([
    { name: 'Core Academics', class_name: 'Class 5', subject_ids: JSON.stringify([subjectIds['Mathematics'], subjectIds['Science'], subjectIds['English'], subjectIds['Hindi'], subjectIds['Social Studies']]) },
    { name: 'Mathematics & Science', class_name: 'Class 6', subject_ids: JSON.stringify([subjectIds['Mathematics'], subjectIds['Science']]) },
    { name: 'Co-Scholastic', class_name: 'Class 5', subject_ids: JSON.stringify([subjectIds['Physical Education'], subjectIds['Art']]) }
  ]);
};