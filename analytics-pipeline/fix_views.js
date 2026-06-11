const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:aWbwblZxLFGXXHblHOcnGOWOSRTLjOWc@acela.proxy.rlwy.net:44512/railway' });

client.connect().then(async () => {
  console.log('Connected!');
  try {
    // Drop remaining views that couldn't be replaced (column mismatch)
    await client.query('DROP VIEW IF EXISTS view_persona_metrics CASCADE');
    await client.query('DROP VIEW IF EXISTS view_device_distribution CASCADE');
    await client.query('DROP VIEW IF EXISTS view_payment_methods CASCADE');
    console.log('Dropped old views');

    await client.query(`
      CREATE VIEW view_persona_metrics AS
      SELECT 
          bot_persona,
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders_placed,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders_paid,
          COUNT(CASE WHEN event_type = 'cart.abandoned' THEN 1 END) as abandonments,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as total_revenue
      FROM aurora_analytics_events
      WHERE is_bot_generated = TRUE AND bot_persona IS NOT NULL
      GROUP BY bot_persona
      ORDER BY total_revenue DESC
    `);
    console.log('Created view: view_persona_metrics');

    await client.query(`
      CREATE VIEW view_device_distribution AS
      SELECT 
          device,
          COUNT(DISTINCT session_id) as sessions,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as sales
      FROM aurora_analytics_events
      WHERE device IS NOT NULL
      GROUP BY device
    `);
    console.log('Created view: view_device_distribution');

    await client.query(`
      CREATE VIEW view_payment_methods AS
      SELECT 
          payment_method,
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN event_type = 'payment.failed' THEN 1 END) as failed_payments,
          ROUND((COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as success_rate_percent
      FROM (
          SELECT payment_method, event_type FROM aurora_analytics_events 
          WHERE event_type IN ('order.paid', 'payment.failed') AND payment_method IS NOT NULL
      ) sub
      GROUP BY payment_method
    `);
    console.log('Created view: view_payment_methods');

    // Final check
    const views = await client.query(
      "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'view_%' ORDER BY table_name"
    );
    console.log('\nAll analytics views:', views.rows.map(r => r.table_name));

  } catch(e) {
    console.error('Error:', e.message);
  }
  await client.end();
  console.log('Done!');
}).catch(e => console.error('Connect error:', e.message));
