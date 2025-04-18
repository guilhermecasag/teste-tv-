const { downloadBrowser } = require('puppeteer-core/internal/node/install.js');
downloadBrowser().catch(e => console.error('Chromium download failed:', e));
