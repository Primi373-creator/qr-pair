const express = require('express');
const { MONGODB_URL, ADMIN_KEY } = require('./config');

const router = express.Router();

router.get('/session/restore', async (req, res) => {
    const sessionId = req.query.sessionId;
    const adminKey = req.query.adminKey;

    if (!sessionId || !adminKey) {
        return res.status(400).send({ error: "Session ID and admin key are required" });
    }

    if (adminKey !== ADMIN_KEY) {
        return res.status(401).send({ error: "Unauthorized" });
    }

    const client = new MongoClient(MONGODB_URL);
    try {
        await client.connect();
        const database = client.db('testdb');
        const collection = database.collection('credentials');
        const fileRecord = await collection.findOne({ fileId: sessionId });
        if (!fileRecord) {
            return res.status(404).send({ error: "File not found" });
        }
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="creds_${sessionId}.zip"`);
        res.send(fileRecord.file);
    } catch (error) {
        console.error('Error retrieving file from MongoDB:', error);
        res.status(500).send({ error: "Internal Server Error" });
    } finally {
        await client.close();
    }
});

module.exports = router;
