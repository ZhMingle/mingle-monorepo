const baseHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const plain = (message, status) => new Response(message, { status, headers: { ...baseHeaders, 'Content-Type': 'text/plain; charset=utf-8' } });
const blocked = path => /^\/api\/(?:bridge|admin)(?:\/|$)/i.test(path) || path === '/healthz';

export function createGateway(assets) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      let path;
      try { path = decodeURIComponent(url.pathname); } catch { return plain('Not found', 404); }
      if (path.includes('\\') || path.includes('\0') || blocked(path)) return plain('Not found', 404);
      const id = request.headers.get('oai-authenticated-user-id');
      const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
      const ownerEmail = env.CLARITY_OWNER_EMAIL?.trim().toLowerCase();
      const owner = Boolean(id && email && ownerEmail && email === ownerEmail);
      const workspace = path === '/' && url.searchParams.get('workspace') === '1';

      let assetPath = path === '/' && !workspace ? '/index.html' : path.startsWith('/demo-assets/') ? path.slice('/demo-assets'.length) : null;
      if (assetPath) {
        if (!['GET', 'HEAD'].includes(request.method)) return plain('Method not allowed', 405);
        const asset = assets[assetPath];
        if (!asset) return plain('Not found', 404);
        const bytes = Uint8Array.from(atob(asset.body), char => char.charCodeAt(0));
        const headers = { ...baseHeaders, 'Content-Type': asset.type, 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
        if (asset.type.startsWith('text/html')) headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com";
        return new Response(request.method === 'HEAD' ? null : bytes, { headers });
      }
      if (workspace && !id) return Response.redirect(`${url.origin}/signin-with-chatgpt?return_to=${encodeURIComponent('/?workspace=1')}`, 302);
      if (!owner) return plain('This private workspace is only available to its owner. Browse the public learning library at /.', id ? 403 : 401);
      if (!env.CLARITY_BACKEND_ORIGIN || !env.CLARITY_PROXY_KEY || env.CLARITY_PROXY_KEY.length < 32) return plain('The private workspace is temporarily unavailable. The public learning library remains available at /.', 503);
      let backend;
      try { backend = new URL(env.CLARITY_BACKEND_ORIGIN); } catch { return plain('Private workspace configuration error', 503); }
      if (backend.protocol !== 'https:') return plain('Private workspace configuration error', 503);
      const target = new URL(backend);
      target.pathname = url.pathname;
      target.search = url.search;
      target.hash = '';
      const headers = new Headers(request.headers);
      for (const name of [...headers.keys()]) if (name === 'cookie' || name === 'authorization' || name.startsWith('oai-') || name.startsWith('x-clarity-') && !['x-clarity-request', 'x-clarity-language'].includes(name) || name === 'host') headers.delete(name);
      headers.set('X-Clarity-Proxy-Key', env.CLARITY_PROXY_KEY);
      try {
        const upstream = await fetch(target, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body, redirect: 'manual' });
        const outgoing = new Headers(upstream.headers);
        outgoing.delete('set-cookie');
        Object.entries(baseHeaders).forEach(([key, value]) => outgoing.set(key, value));
        return new Response(upstream.body, { status: upstream.status, headers: outgoing });
      } catch { return plain('The private workspace is temporarily unavailable. Your saved progress remains stored.', 502); }
    },
  };
}
