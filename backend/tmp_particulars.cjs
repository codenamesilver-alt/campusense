const b = require('C:/Users/Shamsi/Desktop/campusense_backup_2026-09-22.json');
const FeeDue = b.FeeDue || [];
const names = [...new Set(FeeDue.map(r => r.fee_head_name))];
console.log('distinct fee_head_name:', JSON.stringify(names));
const months = [...new Set(FeeDue.map(r => r.due_month))].filter(Boolean);
console.log('due_month values:', JSON.stringify(months));