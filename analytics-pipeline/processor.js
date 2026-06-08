const { Kafka } = require('kafkajs');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
// We use 5435 as host port mapping, but inside Docker network we will connect directly using host: "postgres" and port 5432.
// The DATABASE_URL will default to local host mapping if run outside docker, and can be overridden.
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://analytics_user:analytics_password@localhost:5435/analytics_warehouse';

const kafka = new Kafka({
  clientId: 'auroramart-processor',
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'analytics-group' });

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function connectKafka() {
  const maxRetries = 10;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: 'auroramart-events', fromBeginning: true });
      console.log('Connected to Kafka consumer and subscribed to auroramart-events');
      return;
    } catch (err) {
      console.log(`Kafka Consumer connection attempt ${i} failed. Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Failed to connect Kafka consumer.');
}

async function connectPostgres() {
  const maxRetries = 10;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const client = await pool.connect();
      console.log('Connected to PostgreSQL successfully');
      client.release();
      return;
    } catch (err) {
      console.log(`PostgreSQL connection attempt ${i} failed. Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Failed to connect PostgreSQL.');
}

async function initDatabaseSchema() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'raw_events'
      );
    `);
    
    if (!res.rows[0].exists) {
      console.log('Database tables not found. Initializing schema automatically...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Database schema and BI views initialized successfully.');
      } else {
        console.warn('schema.sql not found! Please run the schema manually.');
      }
    } else {
      console.log('Database tables already exist. Skipping schema initialization.');
    }
  } catch (err) {
    console.error('Error during database schema initialization:', err);
  } finally {
    client.release();
  }
}

async function start() {
  await connectPostgres();
  await initDatabaseSchema();
  await connectKafka();

  await consumer.run({
    eachMessage: async ({ message }) => {
      const valueStr = message.value.toString();
      try {
        const event = JSON.parse(valueStr);
        console.log(`[Processor] Processing: ${event.eventType} - Session: ${event.sessionId}`);

        // Extract values
        const eventId = event.eventId;
        const eventType = event.eventType;
        const sessionId = event.sessionId;
        const userId = event.userId || null;
        const productId = event.productId || null;
        
        let productName = null;
        let productPrice = null;
        let category = null;
        let quantity = null;
        let reason = null;

        if (event.metadata) {
          productName = event.metadata.name || null;
          productPrice = event.metadata.price || null;
          category = event.metadata.category || null;
          quantity = event.metadata.quantity || null;
          reason = event.metadata.reason || null;
        }

        const orderId = event.orderId || null;
        const revenue = event.revenue || null;
        const paymentMethod = event.metadata?.paymentMethod || null;
        const device = event.device || null;
        const city = event.city || null;
        const country = event.country || null;
        const botPersona = event.botPersona || null;
        const isBotGenerated = event.isBotGenerated || false;
        
        const client = await pool.connect();
        try {
          // Insert raw event
          await client.query(`
            INSERT INTO raw_events (
              event_id, event_type, session_id, user_id, product_id, 
              product_name, product_price, category, order_id, revenue, 
              quantity, payment_method, device, city, country, 
              bot_persona, is_bot_generated, reason
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (event_id) DO NOTHING
          `, [
            eventId, eventType, sessionId, userId, productId,
            productName, productPrice, category, orderId, revenue,
            quantity, paymentMethod, device, city, country,
            botPersona, isBotGenerated, reason
          ]);

          // ── Real-Time Fraud & Anomaly Detection Rules ────────────────
          
          // Rule 1: High Quantity in single Add-to-Cart (Potential inventory hoarding)
          if (eventType === 'cart.item_added' && quantity > 15) {
            await client.query(`
              INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              sessionId, userId, 
              'Bulk Inventory Hoarding', 'MEDIUM', 
              `Suspicious action: session added a large quantity (${quantity}) of product "${productName}" to cart.`,
              JSON.stringify({ quantity, productName, productId })
            ]);
            console.log(`[ALERT] Bulk Inventory Hoarding detected for session ${sessionId}`);
          }

          // Rule 2: High Transaction Value Order
          if ((eventType === 'order.placed' || eventType === 'order.paid') && revenue > 400000) {
            await client.query(`
              INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              sessionId, userId, 
              'High-Value Transaction', 'HIGH', 
              `Alert: High transaction value order placed/paid of ₦${Number(revenue).toLocaleString()}.`,
              JSON.stringify({ orderId, revenue, botPersona })
            ]);
            console.log(`[ALERT] High-Value transaction alert for order ${orderId}`);
          }

          // Rule 3: Explicit Fraud Simulator Persona trigger (for BI validation)
          if (eventType === 'checkout.started' && botPersona === 'fraud_attempt') {
            await client.query(`
              INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              sessionId, userId, 
              'Simulated Fraud Persona Active', 'CRITICAL', 
              `A high-risk persona (fraud_attempt) has initiated checkout. Monitoring transactions closely.`,
              JSON.stringify({ device, city, botPersona })
            ]);
            console.log(`[ALERT] Critical fraud attempt session started checkout`);
          }

          // Rule 4: Payment failure alert
          if (eventType === 'payment.failed') {
            await client.query(`
              INSERT INTO fraud_alerts (session_id, user_id, alert_type, severity, description, metadata)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              sessionId, userId, 
              'Payment Failure Alert', 'MEDIUM', 
              `Checkout payment failed. Reason: ${reason || 'insufficient_funds'}.`,
              JSON.stringify({ orderId, reason })
            ]);
            console.log(`[ALERT] Payment failed for session ${sessionId}`);
          }

        } finally {
          client.release();
        }

      } catch (err) {
        console.error('Error handling message in stream processor:', err);
      }
    },
  });
}

start().catch(console.error);
