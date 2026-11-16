// middleware/errorHandler.js – Central error-handling middleware
const errorHandler = (err, req, res, _next) => {
  console.error(err.stack || err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation error', errors: messages });
  }

  // Mongoose duplicate-key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern).join(', ');
    return res.status(409).json({ message: `Duplicate value for: ${field}` });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
