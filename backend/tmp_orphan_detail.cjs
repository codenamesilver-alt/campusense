const b = require('C:/Users/Shamsi/Desktop/campusense_backup_2026-09-22.json');
const Student = b.Student || [];
const FeeDue = b.FeeDue || [];
const byId = new Map(Student.map(s => [String(s.id), s]));
const orph = FeeDue.filter(fd => !byId.has(String(fd.student_id)));

const perStudent = {};
for (const r of orph) {
  const id = String(r.student_id);
  perStudent[id] = perStudent[id] || { rows: 0, bal: 0, paid: 0, due: 0 };
  perStudent[id].rows++;
  perStudent[id].bal += Number(r.balance_amount);
  perStudent[id].paid += Number(r.paid_amount);
  perStudent[id].due += Number(r.due_amount);
}
const studentIds = Object.keys(perStudent).sort();
console.log('orphan student_ids:', studentIds.join(', '));
console.log('count:', studentIds.length);
console.log('id | rows | due_amount(billed) | balance(outstanding)');
for (const id of studentIds) {
  const p = perStudent[id];
  console.log(`${id} | ${p.rows} | ${p.due} | ${p.bal}`);
}
const totDue = studentIds.reduce((a, id) => a + perStudent[id].due, 0);
const totBal = studentIds.reduce((a, id) => a + perStudent[id].bal, 0);
const totPaid = studentIds.reduce((a, id) => a + perStudent[id].paid, 0);
console.log('TOTAL rows:', orph.length, 'billed(due):', totDue, 'paid:', totPaid, 'outstanding(bal):', totBal);
console.log('Student table length:', b.Student.length, 'FeeDue:', b.FeeDue.length);
console.log('sample row:', JSON.stringify(orph[0]));