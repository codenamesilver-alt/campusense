const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select extract(day from due_date) as dom, count(*) n from fee_dues group by 1 order by 1");
  console.table(r.rows);
  const cnt = await c.query("select n, count(*) students from (select student_id, count(*) n from fee_dues group by student_id) t group by n order by n");
  console.table(cnt.rows);
  const s = await c.query("select student_id, to_char(due_date,'Mon YYYY') mon, amount, balance_amount from fee_dues where student_id in (select student_id from fee_dues group by student_id having count(*)=14) order by student_id, due_date limit 30");
  console.table(s.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });