const { spawn } = require('child_process');
const http = require('http');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(body));
        }).on('error', reject);
      });
      const list = JSON.parse(data);
      const page = list.find(p => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch (e) {
      // wait and retry
    }
    await sleep(500);
  }
  throw new Error('Could not connect to Edge DevTools');
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:8080/site/index.html'
  ]);

  try {
    const wsUrl = await getDebuggerUrl();
    console.log('Connected to Edge DevTools:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise(resolve => ws.onopen = resolve);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Wait for page, html2pdf, and subject data to be fully loaded
    let isReady = false;
    for (let i = 0; i < 40; i++) {
      const readyCheck = await send('Runtime.evaluate', {
        expression: `typeof html2pdf !== 'undefined' && document.getElementById('subjectList') && document.getElementById('subjectList').children.length > 0`,
        returnByValue: true
      });
      if (readyCheck && readyCheck.result && readyCheck.result.value) {
        isReady = true;
        break;
      }
      await sleep(300);
    }
    console.log('Page ready state:', isReady);

    // Test full UI workflow:
    // 1. Open PDF Modal
    // 2. Click compile/download button
    // 3. Wait for compilation to finish
    // 4. Verify size and ready box
    const uiTestResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const btnOpen = document.getElementById('btnOpenPdfModal');
          if (!btnOpen) return { error: 'btnOpenPdfModal not found' };
          btnOpen.click();

          const nameInput = document.getElementById('pdfFileNameInput');
          if (nameInput) nameInput.value = 'My_PPM_Exam_Notes';

          const btnDownload = document.getElementById('btnPdfModalDownload');
          if (!btnDownload) return { error: 'btnPdfModalDownload not found' };

          // Trigger downloadDirectPdf
          btnDownload.click();

          // Wait until readyBox is visible or error occurs (up to 30s)
          const start = Date.now();
          while (Date.now() - start < 30000) {
            const readyBox = document.getElementById('pdfReadyBox');
            if (readyBox && readyBox.style.display === 'flex') {
              const filename = document.getElementById('pdfReadyFilename').textContent;
              const meta = document.getElementById('pdfReadyMeta').textContent;
              const btnLabel = document.getElementById('btnDownloadLabel').textContent;
              return {
                status: 'success',
                filename,
                meta,
                btnLabel,
                elapsedMs: Date.now() - start
              };
            }
            const statusText = document.getElementById('pdfProgressStatus');
            if (statusText && statusText.textContent.includes('error')) {
              return { status: 'error', text: statusText.textContent };
            }
            await new Promise(r => setTimeout(r, 500));
          }
          return { status: 'timeout' };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('UI Workflow test result:', uiTestResult.result.value);

    // Test clicking the Save button to ensure the download action executes
    const saveClickResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const btnDownload = document.getElementById('btnPdfModalDownload');
          if (!btnDownload) return { error: 'btnDownload not found' };

          let downloadTriggered = false;
          let downloadedName = null;

          // Intercept createElement for <a> to catch the download link
          const originalCreateElement = document.createElement.bind(document);
          document.createElement = function(tagName) {
            const el = originalCreateElement(tagName);
            if (tagName.toLowerCase() === 'a') {
              const origClick = el.click.bind(el);
              el.click = function() {
                downloadTriggered = true;
                downloadedName = el.download;
                origClick();
              };
            }
            return el;
          };

          btnDownload.click();

          await new Promise(r => setTimeout(r, 500));
          document.createElement = originalCreateElement;

          return {
            downloadTriggered,
            downloadedName
          };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Save button click result:', saveClickResult.result.value);

    ws.close();
  } finally {
    edge.kill();
  }
}

run().catch(console.error);

