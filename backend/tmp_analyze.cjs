const b = require('C:/Users/Shamsi/Desktop/campusense_backup_2026-09-22.json');
const Student = b.Student || [];
const FeeDue = b.FeeDue || [];

const bal = (r) => Number(r.balance_amount) + Number(r.paid_amount); // total billed per row
const byId = new Map(Student.map(s => [String(s.id), s]));

const studentIdStr = (fd) => String(fd.student_id);
const src = (id) => byId.get(id);

const groups = { inactive: [], deleted: [], active: [], orphan: [] };
for (const fd of FeeDue) {
  const id = studentIdStr(fd);
  const s = src(id);
  if (!s) groups.orphan.push(fd);
  else groups[s.status] = groups[s.status] || [];
  if (s) groups[s.status].push(fd);
}

const sum = (arr, fn) => arr.reduce((a, r) => a + fn(r), 0);

for (const g of Object.keys(groups)) {
  const arr = groups[g];
  if (g === 'active') continue;
  console.log(`=== ${g}: FeeDue rows ${arr.length} ===`);
  console.log('  balance sum:', sum(arr, r => Number(r.balance_amount)));
  console.log('  diff (bal+paid) sum:', sum(arr, r => Number(r.balance_amount) + Number(r.paid_amount)));
  const ids = new Set(arr.map(r => studentIdStr(r)));
  console.log('  distinct student_ids:', ids.size);
  if (g === 'deleted') { const rows = arr.map(r=>({id:studentIdStr(r), bal:Number(r.balance_amount), paid:Number(r.paid_amount)})); console.log('  sample:', JSON.stringify(rows.slice(0,3))); }
  if (g === 'inactive') {
    const byStu = {};
    for (const r of arr) { byStu[studentIdStr(r)] = byStu[studentIdStr(r)] || { bal: 0, paid: 0 }; byStu[studentIdStr(r)].bal += Number(r.balance_amount); byStu[studentIdStr(r)].paid += Number(r.paid_amount); }
    console.log('  per-student:', JSON.stringify(byStu));
  }
}
const totalAll = sum(FeeDue, r => Number(r.balance_amount));
const totalPaid = sum(FeeDue, r => Number(r.paid_amount));
console.log('TOTAL backup FeeDue balance:', totalAll, 'paid:', totalPaid, 'combined:', totalAll + totalPaid);