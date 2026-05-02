const { MongoClient } = require('mongodb');

let client;
let db;

async function connectMongo() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  db = client.db(process.env.MONGODB_DB_NAME || 'mini-crm');
  console.log('✅ MongoDB connected');

  // Create indexes
  await db.collection('leads').createIndex({ createdAt: -1 });
  await db.collection('leads').createIndex({ status: 1 });
  await db.collection('leads').createIndex({ source: 1 });

  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB not initialized. Call connectMongo() first.');
  return db;
}

async function closeMongo() {
  if (client) await client.close();
}

module.exports = { connectMongo, getDb, closeMongo };
