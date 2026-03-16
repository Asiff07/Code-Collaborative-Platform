const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Override local DNS to fix querySrv ECONNREFUSED on some networks
    require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4, 
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
