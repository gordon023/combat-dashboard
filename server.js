const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let walletData = []; // In-memory wallet data

// Root route
app.get('/', (req, res) => {
  res.send('Wallet API is running');
});

// Get all wallets
app.get('/wallets', (req, res) => {
  res.json(walletData);
});

// Add a new wallet
app.post('/wallets', (req, res) => {
  const { name, wallet } = req.body;
  if (!name || !wallet) {
    return res.status(400).json({ error: 'Name and wallet are required' });
  }
  const newWallet = { id: Date.now(), name, wallet };
  walletData.push(newWallet);
  res.json(newWallet);
});

// Delete a wallet by ID
app.delete('/wallets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  walletData = walletData.filter(w => w.id !== id);
  res.json({ message: 'Wallet deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
