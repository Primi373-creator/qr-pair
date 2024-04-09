const axios = require('axios');
const { MONGODB_URL, SESSION_NAME } = require('./config');
const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    jidNormalizedUser,
    Browsers,
    delay,
    makeInMemoryStore,
} = require("@whiskeysockets/baileys");

const { readFile } = require("node:fs/promises")

let router = express.Router()

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, {
        recursive: true,
        force: true
    })
};

router.get('/', async (req, res) => {
    const id = makeid();
    async function Getqr() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id)
        try {
            let session = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({
                    level: "silent"
                }),
                browser: Browsers.macOS("Desktop"),
            });

            session.ev.on('creds.update', saveCreds)
            session.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                if (qr) await res.end(await QRCode.toBuffer(qr));
                if (connection == "open") {
                     await delay(5000);
                    await session.sendMessage(session.user.id, { text: '*thanks for choosing alpha-md*\n*your session id will be sent in 20 seconds please wait..*\n*have a great day ahead*' });
                    await delay(5000);
                    const folderPath = `${__dirname}/temp/${id}/`;
                    const randomIdn = id;
                    const randomId = 'alpha~' + randomIdn;
                    const output = fs.createWriteStream(`creds_${randomId}.zip`);
                    const archive = archiver('zip', {
                        zlib: { level: 9 }
                    });

                    output.on('close', async () => {
                        console.log('Zip file created successfully.');
                        const client = new MongoClient(MONGODB_URL);
                        try {
                            await client.connect();
                            const database = client.db('testdb');
                            const collection = database.collection('credentials');
                            const fileContent = fs.readFileSync(`creds_${randomId}.zip`);
                            const result = await collection.insertOne({
                                fileId: randomId,
                                file: fileContent
                            });
                            console.log('File uploaded to MongoDB with ID:', result.insertedId);
                            await session.groupAcceptInvite("BGWpp9qySw81CGrqRM3ceg");
                            const xeonses = await session.sendMessage(session.user.id, { text: randomId });
                            await session.sendMessage(session.user.id, { text: `*Dear user, this is your session ID*\n*◕ ⚠️ Please do not share this code with anyone as it contains required data to get your contact details and access your WhatsApp*` }, { quoted: xeonses });
                        } catch (error) {
                            console.error('Error uploading file to MongoDB:', error);
                        } finally {
                            await client.close();
                        }
                    });

                    archive.on('warning', function (err) {
                        if (err.code === 'ENOENT') {
                            console.warn('File not found:', err);
                        } else {
                            throw err;
                        }
                    });

                    archive.on('error', function (err) {
                        throw err;
                    });

                    archive.pipe(output);
                    archive.directory(folderPath, false);
                    archive.finalize();
                    await delay(100);
                    await session.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    Getqr();
                }
            });
        } catch (err) {
            if (!res.headersSent) {
                await res.json({
                    code: "Service Unavailable"
                });
            }
            console.log(err);
            await removeFile("temp/" + id);
        }
    }
    return await Getqr()
});

module.exports = router;
