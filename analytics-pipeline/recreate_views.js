const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: 'postgresql://postgres:aWbwblZxLFGXXHblHOcnGOWOSRTLjOWc@acela.proxy.rlwy.net:44512/railway' });

client.connect().then(async () => {
  console.log('Connected!');
  try {
    // Recreate indexes on new table name
    await client.query('CREATE INDEX IF NOT EXISTS idx_aurora_events_type ON aurora_analytics_events(event_type)');
    console.log('Created index: type');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aurora_events_session ON aurora_analytics_events(session_id)');
    console.log('Created index: session');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aurora_events_created_at ON aurora_analytics_events(created_at)');
    console.log('Created index: created_at');

    // Recreate analytics views pointing to new table
    await client.query(`
      CREATE OR REPLACE VIEW view_realtime_sales AS
      SELECT 
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as total_orders_placed,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as total_orders_paid,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as total_revenue,
          COUNT(CASE WHEN event_type = 'payment.failed' THEN 1 END) as total_payment_failures,
          COUNT(CASE WHEN event_type = 'cart.abandoned' THEN 1 END) as total_cart_abandonments
      FROM aurora_analytics_events
    `);
    console.log('Created view: view_realtime_sales');

    await client.query(`
      CREATE OR REPLACE VIEW view_hourly_sales AS
      SELECT 
          DATE_TRUNC('hour', created_at) as sales_hour,
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders_placed,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders_paid,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as revenue
      FROM aurora_analytics_events
      GROUP BY sales_hour
      ORDER BY sales_hour DESC
    `);
    console.log('Created view: view_hourly_sales');

    await client.query(`
      CREATE OR REPLACE VIEW view_sales_by_city AS
      SELECT 
          city,
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders_placed,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders_paid,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as revenue,
          COUNT(DISTINCT session_id) as total_sessions
      FROM aurora_analytics_events
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY revenue DESC
    `);
    console.log('Created view: view_sales_by_city');

    await client.query(`
      CREATE OR REPLACE VIEW view_product_performance AS
      SELECT 
          product_id,
          product_name,
          category,
          COUNT(CASE WHEN event_type = 'product.viewed' THEN 1 END) as total_views,
          COUNT(CASE WHEN event_type = 'cart.item_added' THEN 1 END) as total_adds_to_cart,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as total_purchased,
          COALESCE(SUM(CASE WHEN event_type = 'cart.item_added' THEN quantity END), 0) as total_quantity_added,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as total_revenue
      FROM aurora_analytics_events
      WHERE product_id IS NOT NULL
      GROUP BY product_id, product_name, category
      ORDER BY total_revenue DESC, total_views DESC
    `);
    console.log('Created view: view_product_performance');

    await client.query(`
      CREATE OR REPLACE VIEW view_conversion_funnel AS
      SELECT '1. Product Viewed' as step, COUNT(DISTINCT session_id) as unique_sessions
      FROM aurora_analytics_events WHERE event_type = 'product.viewed'
      UNION ALL
      SELECT '2. Added to Cart', COUNT(DISTINCT session_id) FROM aurora_analytics_events WHERE event_type = 'cart.item_added'
      UNION ALL
      SELECT '3. Checkout Started', COUNT(DISTINCT session_id) FROM aurora_analytics_events WHERE event_type = 'checkout.started'
      UNION ALL
      SELECT '4. Order Placed', COUNT(DISTINCT session_id) FROM aurora_analytics_events WHERE event_type = 'order.placed'
      UNION ALL
      SELECT '5. Order Paid', COUNT(DISTINCT session_id) FROM aurora_analytics_events WHERE event_type = 'order.paid'
    `);
    console.log('Created view: view_conversion_funnel');

    await client.query(`
      CREATE OR REPLACE VIEW view_persona_metrics AS
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
      CREATE OR REPLACE VIEW view_device_distribution AS
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
      CREATE OR REPLACE VIEW view_payment_methods AS
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

    console.log('\nAll done! Views recreated on aurora_analytics_events.');

    // Final check
    const views = await client.query(
      "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'view_%' ORDER BY table_name"
    );
    console.log('Analytics views:', views.rows.map(r => r.table_name));

  } catch(e) {
    console.error('Error:', e.message);
  }
  await client.end();
}).catch(e => console.error('Connect error:', e.message));
