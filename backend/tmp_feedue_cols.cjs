const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select column_name from information_schema.columns where table_name='fee_dues' order by ordinal_position");
  console.log(r.rows.map(x => x.column_name).join(', '));
  const s = await c.query("select due_date, fee_type, fee_head_name, due_month, due_year from fee_dues limit 3");
  console.table(s.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });