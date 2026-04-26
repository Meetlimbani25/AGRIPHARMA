const db = require('./backend/config/db');

async function test() {
  const [prods] = await db.query('SELECT id, name, category, shopkeeper_id, is_approved FROM shopkeeper_products ORDER BY id DESC LIMIT 5;');
  console.log('Shopkeeper Products:', prods);
  
  process.exit(0);
}
test();
