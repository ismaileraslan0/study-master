
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env');
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

async function testConnection() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connection successful!');

        const db = client.db('studymaster');
        const collections = await db.listCollections().toArray();
        console.log('📂 Collections:', collections.map(c => c.name));

        const storeCount = await db.collection('store').countDocuments();
        console.log(`📊 Documents in "store": ${storeCount}`);

        const data = await db.collection('store').findOne({ _id: 'app_state' });
        if (data) {
            console.log('📄 Found app_state document.');
        } else {
            console.log('⚠️ app_state document not found.');
        }

    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await client.close();
    }
}

testConnection();
