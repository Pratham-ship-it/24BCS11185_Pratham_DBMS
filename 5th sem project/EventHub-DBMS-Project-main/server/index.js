const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { releaseExpiredBookings } = require('./utils/bookingExpiry');

// Load environment variables from local or parent directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

connectDB().then(() => {
  // Check and release any bookings that expired while the server was down
  releaseExpiredBookings().catch((err) => {
    console.error('Initial releaseExpiredBookings error:', err.message);
  });
});

const app = express();

// CORS configuration supporting local dev and deployed frontend domains (e.g., Vercel)
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
  : null;

app.use(
  cors({
    origin: allowedOrigins ? allowedOrigins : true,
    credentials: true
  })
);

app.use(express.json());

// Health check endpoints for cloud deployment monitoring (Render/Railway/Vercel)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
app.get('/', (req, res) => {
  res.send('EventHub Backend API is running.');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));

// Periodic background task to auto-release expired reservations (every 30 seconds)
const EXPIRY_INTERVAL_MS = 30 * 1000;
setInterval(async () => {
  try {
    await releaseExpiredBookings();
  } catch (err) {
    console.error('Periodic releaseExpiredBookings error:', err.message);
  }
}, EXPIRY_INTERVAL_MS);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
