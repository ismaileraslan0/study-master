
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function triggerSync() {
    try {
        console.log('Connecting to DB...');
        await client.connect();
        const db = client.db('studymaster');

        console.log('Reading full state...');
        const doc = await db.collection('store').findOne({ _id: 'app_state' });
        if (!doc || !doc.state) {
            console.log('No state found!');
            return;
        }

        const state = doc.state;
        const playlists = state.playlists || [];

        // Find the video and mark as watched
        let targetVideo = null;
        for (const p of playlists) {
            if (p.videos) {
                targetVideo = p.videos.find(v => v.id === 'video-1770823474233-0');
                if (targetVideo) break;
            }
        }

        if (targetVideo) {
            console.log(`Found video: ${targetVideo.title}. Setting watched=true and syncing...`);
            targetVideo.watched = true;

            // Send to API
            const res = await fetch('http://localhost:3002/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state })
            });

            const json = await res.json();
            console.log('API Response:', json);
        } else {
            console.log('Target video not found!');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

triggerSync();
