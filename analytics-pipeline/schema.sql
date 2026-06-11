-- Schema for AuroraMart Real-Time Analytics

-- Raw events table
CREATE TABLE IF NOT EXISTS aurora_analytics_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) UNIQUE,
    event_type VARCHAR(50) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    product_id VARCHAR(64),
    product_name VARCHAR(255),
    product_price NUMERIC(12, 2),
    category VARCHAR(100),
    order_id VARCHAR(64),
    revenue NUMERIC(12, 2),
    quantity INTEGER,
    payment_method VARCHAR(50),
    device VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100),
    bot_persona VARCHAR(50),
    is_bot_generated BOOLEAN DEFAULT FALSE,
    reason VARCHAR(255), -- For cart abandonment / payment failure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fraud alerts table (real-time stream anomalies)
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_aurora_events_type ON aurora_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_aurora_events_session ON aurora_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_aurora_events_created_at ON aurora_analytics_events(created_at);

-- ── PostgreSQL Views for Real-Time BI ──────────────────────────

-- 1. Real-time revenue & order statistics
CREATE OR REPLACE VIEW view_realtime_sales AS
SELECT 
    COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as total_orders_placed,
    COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as total_orders_paid,
    COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as total_revenue,
    COUNT(CASE WHEN event_type = 'payment.failed' THEN 1 END) as total_payment_failures,
    COUNT(CASE WHEN event_type = 'cart.abandoned' THEN 1 END) as total_cart_abandonments
FROM aurora_analytics_events;

-- 2. Hourly Sales Trend
CREATE OR REPLACE VIEW view_hourly_sales AS
SELECT 
    DATE_TRUNC('hour', created_at) as sales_hour,
    COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders_placed,
    COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders_paid,
    COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as revenue
FROM aurora_analytics_events
GROUP BY sales_hour
ORDER BY sales_hour DESC;

-- 3. Sales & Conversion by City
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

-- 4. Top Products Performance
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

-- 5. Conversion Funnel (Views -> Add to Cart -> Checkout Start -> Placed -> Paid)
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

-- 6. Bot Persona Metrics
CREATE OR REPLACE VIEW view_persona_metrics AS
SELECT 
    bot_persona,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(CASE WHEN event_type = 'order.placed' THEN 1 END) as orders_placed,
    COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as orders_paid,
    COUNT(CASE WHEN event_type = 'cart.abandoned' THEN 1 END) as abandonments,
    COALESCE(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END), 0) as total_revenue,
    CASE 
        WHEN COUNT(DISTINCT session_id) > 0 THEN 
            ROUND((COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END)::NUMERIC / COUNT(DISTINCT session_id)::NUMERIC) * 100, 2)
        ELSE 0 
    END as conversion_rate_percent,
    CASE 
        WHEN COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) > 0 THEN 
            ROUND(SUM(CASE WHEN event_type = 'order.paid' THEN revenue END) / COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END), 2)
        ELSE 0 
    END as average_order_value
FROM aurora_analytics_events
WHERE is_bot_generated = TRUE AND bot_persona IS NOT NULL
GROUP BY bot_persona
ORDER BY total_revenue DESC;

-- 7. Device Distribution
CREATE OR REPLACE VIEW view_device_distribution AS
SELECT 
    device,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(CASE WHEN event_type = 'order.paid' THEN 1 END) as sales
FROM aurora_analytics_events
WHERE device IS NOT NULL
GROUP BY device;

-- 8. Payment Method Performance
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
