const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select id, class_id, section_id, fee_head_id, amount, frequency, due_date::date from class_fee_structures order by class_id, fee_head_id");
  console.log('rows:', r.rows.length);
  console.table(r.rows);
  const fh = await c.query("select id, name, amount from fee_heads order by id");
  console.table(fh.rows);
  const distinctCf = await c.query("select cf.amount, cf.fee_head_id, fh.name from class_fee_structures cf join fee_heads fh on fh.id=cf.fee_head_id group by cf.amount, cf.fee_head_id, fh.name order by cf.amount");
  console.table(distinctCf.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });