const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const client = new Client();
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

if (!N8N_WEBHOOK_URL) {
  console.error('❌ N8N_WEBHOOK_URL environment variable not set—please add it to your .env file');
  process.exit(1);
}

console.log('✅ WhatsApp to n8n bridge starting...');
console.log('🌐 N8N webhook URL:', N8N_WEBHOOK_URL);

// QR Code for WhatsApp login
client.on('qr', (qr) => {
  console.log('📱 Scan this QR code with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// WhatsApp ready
client.on('ready', () => {
  console.log('🎉 WhatsApp client is ready!');
});

// Handle incoming WhatsApp messages
client.on('message', async msg => {
  // Skip status messages
  if (msg.from === 'status@broadcast') return;

  console.log(`📩 New message from ${msg.from}: ${msg.body}`);

  const payload = {
    from: msg.from,
    body: msg.body,
    type: msg.type,
    timestamp: msg.timestamp,
  };

  try {
    console.log('➡️ Sending message to n8n...');
    const resp = await axios.post(N8N_WEBHOOK_URL, payload);
    console.log('✅ Response from n8n:', resp.data);
    console.log("resp data 1", resp.data['response']);
    console.log("resp data 2", resp.data['from']);
    try
    {
      await client.sendMessage(resp.data['from'], resp.data['response']);  
    }
    catch(err)
    {
      console.error('❗ Error sending message:', err.message);
    }
  } catch (err) {
    console.error('❗ Error sending to n8n:', err.message);
  }
});

// Initialize WhatsApp client
client.initialize();
