const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'default',            // You can change this to support multiple clients
    dataPath: './session'           // Stores session files in ./session/default/
  }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
if (!N8N_WEBHOOK_URL) {
  console.error('❌ N8N_WEBHOOK_URL not set in .env');
  process.exit(1);
}

client.on('qr', qr => {
  console.log('📱 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🎉 WhatsApp client is ready—and session is persisted!');
});

client.on('message', async msg => {
  if (msg.from === 'status@broadcast') return;

  try {
    // Add validation for message and chat
    if (!msg.from || !msg.body) {
      console.log('⚠️ Skipping message with invalid from/body');
      return;
    }

    const chat = await msg.getChat();
    
    // Limit message history to prevent performance issues
    const allMessages = await chat.fetchMessages({ limit: 50 });
    const texts = allMessages
      .filter(m => m.body && m.body.trim()) // Filter out empty messages
      .map(m => m.body);

    const payload = {
      from: msg.from,
      body: msg.body,
      type: msg.type,
      timestamp: msg.timestamp,
      context: texts,
    };

    console.log(`📨 Sending to webhook: ${msg.from}`);
    const resp = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(resp.data)
    const reply = resp.data[0]['response'];
    const to = resp.data[0]['from'];
    console.log(reply)
    console.log(to)
    if (reply && to) {
      await client.sendMessage(to, reply);
      console.log(`✅ Reply sent to: ${to}`);
    }
  } catch (err) {
    if (err.response) {
      console.error(`❗ HTTP Error ${err.response.status}:`, err.response.statusText);
      console.error('Response data:', err.response.data);
    } else if (err.message.includes('wid error')) {
      console.error('❗ Invalid WhatsApp ID, skipping message');
    } else {
      console.error('❗ Error:', err.message);
    }
  }
});

client.initialize();
