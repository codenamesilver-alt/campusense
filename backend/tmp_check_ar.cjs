require('dotenv').config();
const db = require('./src/config/db');
(async () => {
  try {
    const r = await db.raw("select column_name,data_type from information_schema.columns where table_name='approval_requests' order by ordinal_position");
    console.log(r.rows.map((x) => `${x.column_name}:${x.data_type}`).join(' | '));
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
})();