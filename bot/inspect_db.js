
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function inspectDB() {
    try {
        await client.connect();
        const db = client.db('studymaster');

        const doc = await db.collection('store').findOne({ _id: 'app_state' });
        if (doc && doc.state) {
            console.log('State Keys:', Object.keys(doc.state));
            if (doc.state.playlists) {
                console.log('Playlists Count:', doc.state.playlists.length);
                doc.state.playlists.forEach(p => {
                    console.log(`Playlist: ${p.name} (ID: ${p.id})`);
                    if (p.videos && p.videos.length > 0) {
                        const v = p.videos[0];
                        console.log(`  Sample Video: ${v.title} (ID: ${v.id}, Watched: ${v.watched})`);
                    }
                });
            }
        } else {
            console.log('No app_state found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

inspectDB();
