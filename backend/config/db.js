const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Define it in your .env (see .env.example).'
    );
  }

  mongoose.set('strictQuery', true);

  // MongoDB transactions require a replica set (or sharded cluster). A
  // standalone mongod accepts the connection but throws on the first
  // multi-document transaction. Atlas free tier works.
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
  });

  console.log(
    `[db] Connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`
  );

  mongoose.connection.on('error', (err) => {
    console.error('[db] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] Disconnected from MongoDB');
  });
}

module.exports = connectDB;