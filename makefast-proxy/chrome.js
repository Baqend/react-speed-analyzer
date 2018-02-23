const CDP = require('chrome-remote-interface');

const host = 'chrome';
const port = 9222;

async function chrome(action) {
  // Fetch the browser version (since Chrome 62 the browser target URL is
  // Generated at runtime and can be obtained via the '/json/version'
  // Endpoint, fallback to '/devtools/browser' if not present)
  const { webSocketDebuggerUrl } = await CDP.Version({ host, port });

  // Connect to the DevTools special target
  const browser = await CDP({
    target: webSocketDebuggerUrl || 'ws://chrome:9222/devtools/browser',
  });

  // Create a new context
  const { Target } = browser;
  const { browserContextId } = await Target.createBrowserContext();
  const { targetId } = await Target.createTarget({
    url: 'about:blank',
    browserContextId,
  });

  // Connect to the new context
  const client = await CDP({ host, port, target: targetId });
  try {
    return await action(client);
  } finally {
    await Target.closeTarget({ targetId });
    await browser.close();
  }
}

exports.chrome = chrome;
