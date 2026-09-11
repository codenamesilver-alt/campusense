// Fetches ALL records from an entity by paginating, since list()/filter()
// default to a limited number of records per call (max 5,000 per request).
import { base44 } from '@/api/base44Client';

const PAGE_SIZE = 5000; // Base44 SDK maximum per request

export async function fetchAll(entityName, sort = '-created_date') {
  let all = [];
  let skip = 0;
  while (true) {
    const batch = await base44.entities[entityName].list(sort, PAGE_SIZE, skip);
    all = all.concat(batch);
    if (batch.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  return all;
}

export async function fetchAllFiltered(entityName, query, sort = '-created_date') {
  let all = [];
  let skip = 0;
  while (true) {
    const batch = await base44.entities[entityName].filter(query, sort, PAGE_SIZE, skip);
    all = all.concat(batch);
    if (batch.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  return all;
}