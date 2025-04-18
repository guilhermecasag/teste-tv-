require('dotenv').config();
const { create } = require('@wppconnect-team/wppconnect');

create({
  session: 'bot-session',
  puppeteerOptions: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})
.then(client => {
  console.log('✅ QR Code gerado! Escaneie com seu WhatsApp:');

  client.onMessage(message => {
    if (message.body === '#ping') {
      client.sendText(message.from, '🏓 Pong!');
    }
  });
})
.catch(err => console.error('Erro:', err));
