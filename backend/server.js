require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Required for frontend/backend communication

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the schema for your transactions
const transactionSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: '' },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, required: true },
    remark: { type: String, default: '' },
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// API Routes

// Endpoint to get all transactions
app.get('/api/expenditures', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Endpoint to add a new transaction
app.post('/api/expenditures', async (req, res) => {
    try {
        const newTransaction = new Transaction(req.body);
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding transaction' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));