import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Use the same DB as the analytics collector
const pool = new Pool({
  connectionString:
    process.env.ANALYTICS_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:aWbwblZxLFGXXHblHOcnGOWOSRTLjOWc@acela.proxy.rlwy.net:44512/railway',
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const client = await pool.connect();
  try {
    const [
      realtimeRes,
      hourlyRes,
      cityRes,
      productRes,
      funnelRes,
      personaRes,
      deviceRes,
      paymentRes,
      fraudRes,
      todayRes,
      totalEventsRes,
    ] = await Promise.all([
      // Overall stats
      client.query(`SELECT * FROM view_realtime_sales LIMIT 1`),

      // Hourly trend (last 24 hours)
      client.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('hour', created_at), 'HH24:MI') as hour,
          DATE_TRUNC('hour', created_at) as hour_ts,
          COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders,
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as revenue
        FROM aurora_analytics_events
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour_ts ASC
      `),

      // Sales by city (top 8)
      client.query(`SELECT * FROM view_sales_by_city LIMIT 8`),

      // Top products
      client.query(`SELECT * FROM view_product_performance LIMIT 10`),

      // Conversion funnel
      client.query(`SELECT * FROM view_conversion_funnel ORDER BY step`),

      // Bot persona metrics
      client.query(`SELECT * FROM view_persona_metrics`),

      // Device distribution
      client.query(`SELECT * FROM view_device_distribution ORDER BY sessions DESC`),

      // Payment methods
      client.query(`SELECT * FROM view_payment_methods ORDER BY total_attempts DESC`),

      // Recent fraud alerts (last 20)
      client.query(`
        SELECT * FROM fraud_alerts ORDER BY created_at DESC LIMIT 20
      `),

      // Today's stats
      client.query(`
        SELECT
          COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as revenue,
          COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders,
          COUNT(DISTINCT session_id) as sessions
        FROM aurora_analytics_events
        WHERE created_at >= CURRENT_DATE
      `),

      // Total events count
      client.query(`SELECT COUNT(*) as total FROM aurora_analytics_events`),
    ]);

    const realtime = realtimeRes.rows[0] || {};
    const today = todayRes.rows[0] || {};

    return NextResponse.json({
      realtime: {
        total_revenue: Number(realtime.total_revenue || 0),
        total_orders_placed: Number(realtime.total_orders_placed || 0),
        total_orders_paid: Number(realtime.total_orders_paid || 0),
        total_payment_failures: Number(realtime.total_payment_failures || 0),
        total_cart_abandonments: Number(realtime.total_cart_abandonments || 0),
      },
      today: {
        revenue: Number(today.revenue || 0),
        orders: Number(today.orders || 0),
        sessions: Number(today.sessions || 0),
      },
      total_events: Number(totalEventsRes.rows[0]?.total || 0),
      hourly: hourlyRes.rows.map((r) => ({
        hour: r.hour,
        orders: Number(r.orders),
        revenue: Number(r.revenue),
      })),
      cities: cityRes.rows.map((r) => ({
        city: r.city,
        orders_placed: Number(r.orders_placed),
        orders_paid: Number(r.orders_paid),
        revenue: Number(r.revenue),
        total_sessions: Number(r.total_sessions),
      })),
      products: productRes.rows.map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        category: r.category,
        total_views: Number(r.total_views),
        total_adds_to_cart: Number(r.total_adds_to_cart),
        total_purchased: Number(r.total_purchased),
        total_revenue: Number(r.total_revenue),
      })),
      funnel: funnelRes.rows.map((r) => ({
        step: r.step,
        unique_sessions: Number(r.unique_sessions),
      })),
      personas: personaRes.rows.map((r) => ({
        bot_persona: r.bot_persona,
        total_sessions: Number(r.total_sessions),
        orders_placed: Number(r.orders_placed),
        orders_paid: Number(r.orders_paid),
        abandonments: Number(r.abandonments),
        total_revenue: Number(r.total_revenue),
      })),
      devices: deviceRes.rows.map((r) => ({
        device: r.device,
        sessions: Number(r.sessions),
        sales: Number(r.sales),
      })),
      payments: paymentRes.rows.map((r) => ({
        payment_method: r.payment_method,
        total_attempts: Number(r.total_attempts),
        successful_payments: Number(r.successful_payments),
        failed_payments: Number(r.failed_payments),
        success_rate_percent: Number(r.success_rate_percent),
      })),
      fraud_alerts: fraudRes.rows.map((r) => ({
        id: r.id,
        session_id: r.session_id,
        alert_type: r.alert_type,
        severity: r.severity,
        description: r.description,
        created_at: r.created_at,
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Analytics API] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
