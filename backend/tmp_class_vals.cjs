const { Client } = require('pg');
const url = process.argv[2];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("select distinct class, section from students where status='active' order by class, section");
  console.table(r.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });