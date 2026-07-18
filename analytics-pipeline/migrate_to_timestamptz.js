const { Client } = require('pg');

const connectionString = 'postgresql://postgres:aWbwblZxLFGXXHblHOcnGOWOSRTLjOWc@acela.proxy.rlwy.net:44512/railway';
const client = new Client({ connectionString });

async function run() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected!');

  try {
    console.log('Starting migration transaction...');
    await client.query('BEGIN');

    // 1. Drop all dependent views (using CASCADE to ensure all dependencies are dropped)
    console.log('Dropping dependent views...');
    await client.query('DROP VIEW IF EXISTS view_realtime_sales CASCADE');
    await client.query('DROP VIEW IF EXISTS view_hourly_sales CASCADE');
    await client.query('DROP VIEW IF EXISTS view_sales_by_city CASCADE');
    await client.query('DROP VIEW IF EXISTS view_product_performance CASCADE');
    await client.query('DROP VIEW IF EXISTS view_conversion_funnel CASCADE');
    await client.query('DROP VIEW IF EXISTS view_persona_metrics CASCADE');
    await client.query('DROP VIEW IF EXISTS view_device_distribution CASCADE');
    await client.query('DROP VIEW IF EXISTS view_payment_methods CASCADE');

    // 2. Alter column types to TIMESTAMP WITH TIME ZONE
    console.log('Altering aurora_analytics_events.created_at to TIMESTAMPTZ...');
    await client.query('ALTER TABLE aurora_analytics_events ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING (created_at::TIMESTAMP WITH TIME ZONE)');

    console.log('Altering fraud_alerts.created_at to TIMESTAMPTZ...');
    await client.query('ALTER TABLE fraud_alerts ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING (created_at::TIMESTAMP WITH TIME ZONE)');

    // 3. Recreate the views with the original schema definition
    console.log('Recreating view_realtime_sales...');
    await client.query(`
      CREATE OR REPLACE VIEW view_realtime_sales AS
      SELECT 
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as total_orders_placed,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as total_orders_paid,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as total_revenue,
          COUNT(CASE WHEN event_type = 'payment.failed' THEN 1 END) as total_payment_failures,
          COUNT(CASE WHEN event_type = 'cart.abandoned' THEN 1 END) as total_cart_abandonments
      FROM aurora_analytics_events;
    `);

    console.log('Recreating view_hourly_sales...');
    await client.query(`
      CREATE OR REPLACE VIEW view_hourly_sales AS
      SELECT 
          DATE_TRUNC('hour', created_at) as sales_hour,
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders_placed,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders_paid,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as revenue
      FROM aurora_analytics_events
      GROUP BY sales_hour
      ORDER BY sales_hour DESC;
    `);

    console.log('Recreating view_sales_by_city...');
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
      ORDER BY revenue DESC;
    `);

    console.log('Recreating view_product_performance...');
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
      ORDER BY total_revenue DESC, total_views DESC;
    `);

    console.log('Recreating view_conversion_funnel...');
    await client.query(`
      CREATE OR REPLACE VIEW view_conversion_funnel AS
      SELECT
          '1. Product Viewed' as step,
          COUNT(DISTINCT session_id) as unique_sessions
      FROM aurora_analytics_events WHERE event_type = 'product.viewed'
      UNION ALL
      SELECT
          '2. Added to Cart' as step,
          COUNT(DISTINCT session_id) as unique_sessions
      FROM aurora_analytics_events WHERE event_type = 'cart.item_added'
      UNION ALL
      SELECT
          '3. Checkout Started' as step,
          COUNT(DISTINCT session_id) as unique_sessions
      FROM aurora_analytics_events WHERE event_type = 'checkout.started'
      UNION ALL
      SELECT
          '4. Order Placed' as step,
          COUNT(DISTINCT session_id) as unique_sessions
      FROM aurora_analytics_events WHERE event_type = 'order.placed'
      UNION ALL
      SELECT
          '5. Order Paid' as step,
          COUNT(DISTINCT session_id) as unique_sessions
      FROM aurora_analytics_events WHERE event_type = 'order.paid';
    `);

    console.log('Recreating view_persona_metrics...');
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
      ORDER BY total_revenue DESC;
    `);

    console.log('Recreating view_device_distribution...');
    await client.query(`
      CREATE OR REPLACE VIEW view_device_distribution AS
      SELECT 
          device,
          COUNT(DISTINCT session_id) as sessions,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as sales
      FROM aurora_analytics_events
      WHERE device IS NOT NULL
      GROUP BY device;
    `);

    console.log('Recreating view_payment_methods...');
    await client.query(`
      CREATE OR REPLACE VIEW view_payment_methods AS
      SELECT 
          payment_method,
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN event_type = 'payment.failed' THEN 1 END) as failed_payments,
          ROUND((COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as success_rate_percent
      FROM (
          SELECT payment_method, event_type FROM aurora_analytics_events WHERE event_type IN ('order.paid', 'payment.failed') AND payment_method IS NOT NULL
      ) sub
      GROUP BY payment_method;
    `);

    console.log('Committing transaction...');
    await client.query('COMMIT');
    console.log('Migration completed successfully! All columns changed to TIMESTAMPTZ.');
  } catch (error) {
    console.error('Migration failed. Rolling back...', error);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

run().catch(console.error);
