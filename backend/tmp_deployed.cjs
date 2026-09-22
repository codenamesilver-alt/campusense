const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const tot = await c.query("select count(*) n, coalesce(sum(balance_amount),0) bal, coalesce(sum(paid_amount),0) paid from fee_dues");
  console.log('deployed fee_dues total rows:', tot.rows[0].n, 'balance:', tot.rows[0].bal, 'paid:', tot.rows[0].paid);
  const pend = await c.query("select status, count(*) n, coalesce(sum(balance_amount),0) bal from fee_dues group by status");
  console.table(pend.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });