const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Database connection string with specific database name
    // Format: mongodb+srv://username:password@cluster/DATABASE_NAME
    const mongoUri = process.env.MONGODB_URI || 'MONGODB_URI/online_clipboard';
    
    const options = {
      // Remove deprecated options
    };

    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📊 Database name: ${conn.connection.name}`); // This will show the database name
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
