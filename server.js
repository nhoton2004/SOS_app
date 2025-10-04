// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Tải các biến môi trường từ file .env
dotenv.config();

// Kết nối tới MongoDB
connectDB();

const app = express();

// Các thiết lập khác của Express...
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`🚀 Server running on port ${PORT}`));