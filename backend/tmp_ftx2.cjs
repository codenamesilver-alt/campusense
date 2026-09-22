const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select status, count(*) n, sum(net_amount) total from fee_transactions group by status order by 2 desc");
  console.table(r.rows);
  const t = await c.query("select count(*), min(transaction_date), max(transaction_date) from fee_transactions");
  console.table(t.rows);
  const today = await c.query("select to_char(transaction_date,'YYYY-MM-DD') d, status, net_amount from fee_transactions where transaction_date::text >= '2026-09-01' order by transaction_date limit 15");
  console.table(today.rows);
  const due = await c.query("select status, count(*) n, sum(balance_amount) bal from fee_dues group by status order by 2 desc");
  console.table(due.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });