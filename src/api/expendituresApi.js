// Example of a conceptual Node.js/Express API structure

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

app.use(bodyParser.json());

// In-memory "database" for demonstration purposes
let transactions = [];

// Endpoint to get all transactions
app.get('/api/expenditures', (req, res) => {
    res.json(transactions);
});

// Endpoint to add a new transaction
app.post('/api/expenditures', (req, res) => {
    const newTransaction = {
        ...req.body,
        id: transactions.length + 1,
        date: new Date().toISOString()
    };
    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
});

app.listen(port, () => {
    console.log(`Expenditures API listening on http://localhost:${port}`);
});