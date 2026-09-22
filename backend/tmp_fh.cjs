const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const fh = await c.query("select id, name, fee_type, amount from fee_heads order by name");
  console.table(fh.rows);
  const fe = await c.query("select id, name, fee_type, amount, fee_head_name, frequency, applicability from fees order by name");
  console.table(fe.rows);
  const cfs = await c.query("select fee_head_id, amount, frequency, due_date::date from class_fee_structures limit 15");
  console.table(cfs.rows);
  const du = await c.query("select amount, count(*) n from fee_dues group by amount order by amount");
  console.table(du.rows);
  const dd = await c.query("select extract(month from due_date) as mon, count(*) n from fee_dues group by 1 order by 1");
  console.table(dd.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });