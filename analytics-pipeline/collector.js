const { Kafka } = require('kafkajs');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const PORT = process.env.PORT || 5001;

const kafka = new Kafka({
  clientId: 'auroramart-collector',
  brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();

async function connectWithRetry() {
  const maxRetries = 10;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await producer.connect();
      console.log('Connected to Kafka producer successfully');
      return;
    } catch (err) {
      console.log(`Kafka connection attempt ${i} failed. Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Failed to connect to Kafka after multiple retries.');
}

app.post('/events', async (req, res) => {
  try {
    const event = req.body;
    
    // Add unique message UUID if not present
    if (!event.eventId) {
      event.eventId = crypto.randomUUID();
    }
    
    // Log event receipt
    console.log(`[Collector] Received: ${event.eventType} - Session: ${event.sessionId}`);

    // Publish to Kafka
    await producer.send({
      topic: 'auroramart-events',
      messages: [
        {
          key: event.sessionId || 'anonymous',
          value: JSON.stringify(event),
        },
      ],
    });
    
    res.status(202).json({ success: true, eventId: event.eventId });
  } catch (error) {
    console.error('Error sending event to Kafka:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

// Start application
connectWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Event Collector API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Application failed to start:', err);
    process.exit(1);
  });
