const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const ft = await c.query("select fee_type, count(*) n from fee_dues group by fee_type order by n desc limit 20");
  console.log('fee_dues.fee_type values:');
  console.table(ft.rows);
  const fd = await c.query("select * from fee_dues where fee_type is not null and fee_type <> '' limit 5");
  console.log('sample non-null:');
  console.table(fd.rows);
  const frees = await c.query("select id, name, head_id, is_discount, created_date from fees limit 10");
  console.log('fees table:');
  console.table(frees.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });