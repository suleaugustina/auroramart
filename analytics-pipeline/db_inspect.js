const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:aWbwblZxLFGXXHblHOcnGOWOSRTLjOWc@acela.proxy.rlwy.net:44512/railway' });

client.connect().then(async () => {
  console.log('Connected!');
  try {
    // List all views
    const views = await client.query(
      "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Views:', views.rows.map(r => r.table_name));

    // List all tables
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    console.log('Tables:', tables.rows.map(r => r.table_name));

    // Drop all our analytics views
    console.log('\nDropping analytics views...');
    await client.query('DROP VIEW IF EXISTS view_hourly_sales CASCADE');
    console.log('Dropped view_hourly_sales');
    await client.query('DROP VIEW IF EXISTS view_daily_sales CASCADE');
    console.log('Dropped view_daily_sales');
    await client.query('DROP VIEW IF EXISTS view_product_performance CASCADE');
    console.log('Dropped view_product_performance');
    await client.query('DROP VIEW IF EXISTS hourly_sales CASCADE');
    console.log('Dropped hourly_sales (if existed)');
    await client.query('DROP VIEW IF EXISTS daily_sales CASCADE');
    console.log('Dropped daily_sales (if existed)');

    // Rename store_events -> aurora_analytics_events
    console.log('\nRenaming store_events -> aurora_analytics_events...');
    await client.query('ALTER TABLE IF EXISTS store_events RENAME TO aurora_analytics_events');
    console.log('Renamed!');

    // Verify
    const tables2 = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    console.log('\nTables after rename:', tables2.rows.map(r => r.table_name));

  } catch(e) {
    console.error('Error:', e.message);
  }
  await client.end();
  console.log('Done!');
}).catch(e => console.error('Connect error:', e.message));
