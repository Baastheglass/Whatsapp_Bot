const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

const client = new Client();
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
console.log(N8N_WEBHOOK_URL)
// QR Code for WhatsApp login
client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// WhatsApp ready
client.on('ready', () => {
  console.log('WhatsApp client is ready!');
});

// WhatsApp → n8n webhook
client.on('message', async msg => {
  // Skip status messages
  if (msg.from === 'status@broadcast') {
    return;
  }

  console.log(`New message from ${msg.from}: ${msg.body}`);
  
  const payload = {
    from: msg.from,
    body: msg.body,
    type: msg.type,
    timestamp: msg.timestamp
  };

  if (!N8N_WEBHOOK_URL) {
    console.error('N8N_WEBHOOK_URL environment variable not set');
    return;
  }

  try {
    console.log('Sending to n8n webhook...');
    await axios.post(N8N_WEBHOOK_URL, payload);
    console.log('Message sent to n8n successfully');
  } catch(err) {
    console.error('Error sending to n8n:', err.message);
  }
});

// Initialize WhatsApp client
client.initialize();

console.log('WhatsApp to n8n bridge starting...');
console.log('N8N webhook URL:', N8N_WEBHOOK_URL || 'NOT SET');