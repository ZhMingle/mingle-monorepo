import { createServer } from 'node:http';
import worker from '../dist/server/index.js';
const server = createServer(async (incoming, outgoing) => {
  try {
    const buffers = [];
    for await (const buffer of incoming) buffers.push(buffer);
    const body = Buffer.concat(buffers);
    const result = await worker.fetch(new Request(`http://127.0.0.1:${server.address().port}${incoming.url}`, { method: incoming.method, headers: incoming.headers, body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : body }), {});
    outgoing.writeHead(result.status, Object.fromEntries(result.headers));
    outgoing.end(Buffer.from(await result.arrayBuffer()));
  } catch { outgoing.writeHead(500); outgoing.end('Preview failed'); }
});
server.listen(5180, '127.0.0.1', () => console.log('Clarity public preview: http://127.0.0.1:5180'));
