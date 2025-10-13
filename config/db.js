const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined');
  }

  try {
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error', error);
    throw error;
  }
};

module.exports = connectDB;
