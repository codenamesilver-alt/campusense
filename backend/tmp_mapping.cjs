const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select id, student_id, fee_head_id, amount, due_date::date, status, academic_year from student_fee_mappings limit 12");
  console.table(r.rows);
  const n = await c.query("select count(*) from student_fee_mappings");
  console.log('count student_fee_mappings:', n.rows[0].count);
  const join = await c.query(`
    select m.id as map_id, m.fee_head_id, fh.name,
           d.id as due_id, d.balance_amount, d.due_date::date
    from fee_dues d
    join students s on s.id = d.student_id
    join student_fee_mappings m on m.student_id = d.student_id and m.due_date = d.due_date
    join fee_heads fh on fh.id = m.fee_head_id
    limit 15`);
  console.log('JOIN fee_dues->mappings->heads:');
  console.table(join.rows);
  const jn = await c.query(`
    select count(*) matched
    from fee_dues d
    join students s on s.id = d.student_id
    join student_fee_mappings m on m.student_id = d.student_id and m.due_date = d.due_date`);
  console.log('matched fee_dues rows:', jn.rows[0].matched);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });