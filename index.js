const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) },
    logger: pino({level:"silent"}),
    browser: [config.botName, "Chrome", "1.0.0"]
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close'){
      if(lastDisconnect?.error?.output?.statusCode !== 401) startBot();
      else console.log('Logged out, delete session folder');
    } else if(connection === 'open'){
      console.log(`✅ ${config.botName} Connected!`);
    }
  });

  sock.ev.on('messages.upsert', async ({messages}) => {
    const m = messages[0];
    if(!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
    if(!body.startsWith(config.prefix)) return;
    const args = body.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // .menu - tumhari demand ⚙️ react ke sath
    if(command === 'menu' || command === 'help'){
      await sock.sendMessage(from, { react: { text: "⚙️", key: m.key } });
      let menu = `╭━━━ *${config.botName}* ━━━╮
┃ Owner: 923012833345
┃ User: ${m.pushName}
╰━━━━━━━━━━━━━━━╯

╭━━ *GROUP* ━━╮
┃ .tagall - sab ko
