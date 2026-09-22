const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const join = await c.query(`
    select m.fee_head_id, fh.name,
           d.id as due_id, d.student_id, d.balance_amount, d.due_date::date
    from fee_dues d
    join student_fee_mappings m on m.student_id = d.student_id and m.due_date::date = d.due_date::date
    join fee_heads fh on fh.id = m.fee_head_id
    where d.balance_amount > 0 and d.status='pending'
    order by d.student_id limit 25`);
  console.table(join.rows);
  const jn = await c.query(`
    select count(*) matched from fee_dues d
    join student_fee_mappings m on m.student_id = d.student_id and m.due_date::date = d.due_date::date`);
  console.log('matched fee_dues rows:', jn.rows[0].matched);
  const errs = await c.query(`
    select count(*) unmatched from fee_dues d
    left join student_fee_mappings m on m.student_id = d.student_id and m.due_date::date = d.due_date::date
    where m.id is null`);
  console.log('unmatched fee_dues rows:', errs.rows[0].matched);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });