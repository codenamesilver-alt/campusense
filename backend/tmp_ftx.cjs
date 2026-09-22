const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select column_name, data_type from information_schema.columns where table_name='fee_transactions' order by ordinal_position");
  console.table(r.rows);
  const n = await c.query("select count(*) n, count(net_amount) with_net, count(amount) with_amount from fee_transactions");
  console.table(n.rows);
  const s = await c.query("select id, status, transaction_date::date, net_amount, amount, paid_amount, balance_amount from fee_transactions limit 10");
  console.table(s.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });