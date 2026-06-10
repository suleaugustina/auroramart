/**
 * ════════════════════════════════════════════════
 *  AURORAMART EVENT COLLECTOR
 *  ──────────────────────────────────────────────
 *  Simplified direct-to-PostgreSQL pipeline.
 *  No Kafka needed. Receives events from bots/app,
 *  writes to PostgreSQL, and runs fraud detection.
 * ════════════════════════════════════════════════
 */

const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const app  = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT         = process.env.PORT || 5001;
const DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://analytics_user:analytics_password@localhost:5435/analytics_warehouse';

const pool = new Pool({ connectionString: DATABASE_URL });

// ── Auto-initialize Schema ─────────────────────────────────────
async function initSchema() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'raw_events'
      );
    `);

    if (!rows[0].exists) {
      console.log('[Startup] No tables found — running schema.sql automatically...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sql);
        console.log('[Startup] Database tables and analytics views created successfully!');
      } else {
        console.error('[Startup] schema.sql not found! Could not initialize database.');
      }
    } else {
      console.log('[Startup] Database tables already exist. Ready to receive events.');
    }
  } finally {
    client.release();
  }
}

// ── Health Check ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'AuroraMart Event Collector is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Event Receiver ─────────────────────────────────────────────
app.post('/events', async (req, res) => {
  const event = req.body;

  if (!event || !event.eventType || !event.sessionId) {
    return res.status(400).json({ error: 'Missing required fields: eventType, sessionId' });
  }

  const eventId = event.eventId || crypto.randomUUID();

  // Extract all fields
  const eventType     = event.eventType;
  const sessionId     = event.sessionId;
  const userId        = event.userId        || null;
  const productId     = event.productId     || null;
  const orderId       = event.orderId       || null;
  const revenue       = event.revenue       || null;
  const device        = event.device        || null;
  const city          = event.city          || null;
  const country       = event.country       || null;
  const botPersona    = event.botPersona    || null;
  const isBotGenerated = event.isBotGenerated ?? false;

  // Extract from nested metadata
  const productName   = event.metadata?.name          || null;
  const productPrice  = event.metadata?.price         || null;
  const category      = event.metadata?.category      || null;
  const quantity      = event.metadata?.quantity      || null;
  const paymentMethod = event.metadata?.paymentMethod || null;
  const reason        = event.metadata?.reason        || null;

  const client = await pool.connect();
  try {
    // ── 1. Write raw event ──────────────────────────────────────
    await client.query(`
      INSERT INTO raw_events (
        event_id, event_type, session_id, user_id, product_id,
        product_name, product_price, category, order_id, revenue,
        quantity, payment_method, device, city, country,
        bot_persona, is_bot_generated, reason
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (event_id) DO NOTHING
    `, [
      eventId, eventType, sessionId, userId, productId,
      productName, productPrice, category, orderId, revenue,
      quantity, paymentMethod, device, city, country,
      botPersona, isBotGenerated, reason
    ]);

    // ── 2. Real-Time Fraud Detection Rules ─────────────────────

    // Rule 1: Inventory Hoarding (added > 15 of one item)
    if (eventType === 'cart.item_added' && quantity > 15) {
      await client.query(`
        INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        sessionId, userId,
        'Bulk Inventory Hoarding', 'MEDIUM',
        `Session added ${quantity}x "${productName || 'product'}" to cart — possible hoarding.`,
        JSON.stringify({ quantity, productName, productId })
      ]);
    }

    // Rule 2: High-Value Transaction (order > ₦400,000)
    if ((eventType === 'order.placed' || eventType === 'order.paid') && revenue > 400000) {
      await client.query(`
        INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        sessionId, userId,
        'High-Value Transaction', 'HIGH',
        `Order of ₦${Number(revenue).toLocaleString()} flagged for review.`,
        JSON.stringify({ orderId, revenue, botPersona })
      ]);
    }

    // Rule 3: Fraud persona starting checkout
    if (eventType === 'checkout.started' && botPersona === 'fraud_attempt') {
      await client.query(`
        INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        sessionId, userId,
        'Suspicious Checkout Pattern', 'CRITICAL',
        `High-risk session initiated checkout. Pattern matches fraud profile.`,
        JSON.stringify({ device, city, botPersona })
      ]);
    }

    // Rule 4: Payment failure
    if (eventType === 'payment.failed') {
      await client.query(`
        INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        sessionId, userId,
        'Payment Failure', 'LOW',
        `Payment failed for session. Reason: ${reason || 'insufficient_funds'}.`,
        JSON.stringify({ orderId, reason })
      ]);
    }

    console.log(`[Event] ${eventType} | ${city || 'Unknown'} | ${botPersona || 'real_user'}`);
    res.status(202).json({ success: true, eventId });

  } catch (err) {
    console.error('[Error] Failed to process event:', err.message);
    res.status(500).json({ error: 'Failed to process event' });
  } finally {
    client.release();
  }
});

// ── Start Server ───────────────────────────────────────────────
async function start() {
  let retries = 0;
  while (retries < 15) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('[Startup] Connected to PostgreSQL successfully.');
      break;
    } catch {
      retries++;
      console.log(`[Startup] Waiting for PostgreSQL... attempt ${retries}/15`);
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  await initSchema();

  app.listen(PORT, () => {
    console.log(`\n✅ AuroraMart Event Collector running on port ${PORT}`);
    console.log(`   POST /events  — receive and store analytics events`);
    console.log(`   GET  /health  — health check\n`);
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
