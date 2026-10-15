const http = require('http');
const app = require('../server/app');

function startTestServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;
      resolve({
        baseUrl,
        close: () => new Promise((res) => server.close(res))
      });
    });
    server.on('error', reject);
  });
}

module.exports = { startTestServer };
