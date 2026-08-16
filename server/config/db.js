const mongoose = require('mongoose');
const dns=require('dns');
const connectDB = async () => {
  try {
    dns.setServers(["8.8.8.8","1.1.1.1"]);
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodconnect';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
