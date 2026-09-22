const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select remarks, count(*) n from fee_dues group by remarks order by n desc limit 30");
  console.log('fee_dues.remarks values:');
  console.table(r.rows);
  const a = await c.query("select id, fee_type, amount, paid_amount, balance_amount, due_date::date, remarks from fee_dues where remarks is not null and remarks<>'' limit 10");
  console.log('sample rows with remarks:');
  console.table(a.rows);
  const ft = await c.query("select column_name from information_schema.columns where table_name in ('fees','fee_heads','fees_masters','fees_types','fees_groups','class_fee_structures','student_fee_mappings') order by table_name, ordinal_position");
  console.log('related table columns:');
  console.table(ft.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });