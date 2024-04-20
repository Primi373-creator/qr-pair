const axios = require('axios');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { makeid } = require('./id');
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
        const {  state, saveCreds } =await useMultiFileAuthState('./session/'+id)
        try {
            let alpha = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({
                    level: "silent"
                }),
                browser: Browsers.windows('Firefox'),
            });

            alpha.ev.on('creds.update', saveCreds)
            alpha.ev.on("connection.update",async  (s) => {
            const { connection, lastDisconnect, qr } = s;
            if (qr) await res.end(await QRCode.toBuffer(qr));
                if (connection == "open") {
            await delay(1000 * 10)
            await alpha.sendMessage(alpha.user.id, { text: '*thanks for choosing alpha-md*\n*your sesssionid will be sent in soon please wait..*\n*have a great day ahead*' });
            await delay(1000 * 10)
            const folderPath = `./session/${id}/`;
        const unique = fs.readFileSync(__dirname + `/session/${id}/creds.json`)
        const c = Buffer.from(unique).toString('base64');
        const response = await axios.get(`https://api.alpha-md.rf.gd/session/upload?content=${encodeURIComponent(c)}`);
              console.log(response.data.id)                               
         alpha.groupAcceptInvite("BGWpp9qySw81CGrqRM3ceg");
       const xeonses = await alpha.sendMessage(alpha.user.id, { text: response.data.id });
       await alpha.sendMessage(alpha.user.id, { text: `*ᴅᴇᴀʀ ᴜsᴇʀ ᴛʜɪs ɪs ʏᴏᴜʀ sᴇssɪᴏɴ ɪᴅ*\n*◕ ⚠️ ᴘʟᴇᴀsᴇ ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ ᴀs ɪᴛ ᴄᴏɴᴛᴀɪɴs ʀᴇǫᴜɪʀᴇᴅ ᴅᴀᴛᴀ ᴛᴏ ɢᴇᴛ ʏᴏᴜʀ ᴄᴏɴᴛᴀᴄᴛ ᴅᴇᴛᴀɪʟs ᴀɴᴅ ᴀᴄᴄᴇss ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ*` }, {quoted: xeonses});
       await delay(1000 * 2)
       process.exit(0);
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            Getqr();
                }    
            });
            alpha.ev.on('creds.update', saveCreds);
            alpha.ev.on("messages.upsert",  () => { });
        } catch (err) {
            if (!res.headersSent) {
                await res.json({
                    code: "Service Unavailable"
                });
            }
            console.log(err);
        }
    }
    return await Getqr()
});

module.exports = router;
