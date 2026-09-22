const b = require('C:/Users/Shamsi/Desktop/campusense_backup_2026-09-22.json');
const FeeDue = b.FeeDue || [];
const byStatus = {};
for (const r of FeeDue) {
  const s = r.status;
  byStatus[s] = byStatus[s] || { n: 0, bal: 0, paid: 0, due: 0 };
  byStatus[s].n++;
  byStatus[s].bal += Number(r.balance_amount);
  byStatus[s].paid += Number(r.paid_amount);
  byStatus[s].due += Number(r.due_amount);
}
for (const s of Object.keys(byStatus)) {
  console.log(s, JSON.stringify(byStatus[s]));
}
const tot = FeeDue.reduce((a,r)=>({n:a.n+1, bal:a.bal+Number(r.balance_amount)}),{n:0,bal:0});
console.log('TOTAL', JSON.stringify(tot));
const stu = b.Student||[];
const byStatus2 = {};
for (const s of stu) byStatus2[s.status] = (byStatus2[s.status]||0)+1;
console.log('STUDENTS:', JSON.stringify(byStatus2));