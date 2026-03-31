const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');

const url = process.argv[2];
const outPath = process.argv[3];

function getTabWs() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const tabs = JSON.parse(body);
        const tab = tabs.find(t => t.type === 'page');
        if (tab) resolve(tab.webSocketDebuggerUrl);
        else reject(new Error('No page tab found'));
      });
    }).on('error', reject);
  });
}

async function main() {
  const wsUrl = await getTabWs();
  const ws = new WebSocket(wsUrl);

  let msgId = 0;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = ++msgId;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          ws.removeListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(r => ws.on('open', r));

  await send('Emulation.setDeviceMetricsOverride', {
    width: 375, height: 812, deviceScaleFactor: 2, mobile: true
  });

  if (url) {
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 4000));
  }

  const result = await send('Page.captureScreenshot', {
    format: 'png', clip: { x: 0, y: 0, width: 375, height: 812, scale: 1 }
  });

  fs.writeFileSync(outPath, Buffer.from(result.data, 'base64'));
  console.log('Saved:', outPath);
  ws.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
