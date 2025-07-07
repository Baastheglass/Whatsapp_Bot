const express = require('express');
const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

app.post('/reply', (req, res) => {
  console.log('Received body:', req.body);
  const received = req.body;

  // Process or transform data
  const reply = { reply: `You said: "${received.body}"` };

  res.json(reply);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));