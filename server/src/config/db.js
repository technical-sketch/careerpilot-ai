import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.log('ℹ️  MONGODB_URI is not set. Using temporary in-memory storage.');
    return false;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('⚠️ MongoDB connection failed; continuing with temporary in-memory storage:', error.message);
    return false;
  }
}
