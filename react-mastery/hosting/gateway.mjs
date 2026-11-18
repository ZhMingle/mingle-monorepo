const baseHeaders = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json = (value, status = 200) => new Response(JSON.stringify(value), {status, headers:{...baseHeaders,'Content-Type':'application/json; charset=utf-8'}});
const blocked = path => /^\/api\/(?:bridge|admin)(?:\/|$)/i.test(path) || path === '/healthz';

export function createGateway(assets, visitor) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      let path;
      try { path = decodeURIComponent(url.pathname); } catch { return json({error:'Not found'},404); }
      if (path.includes('\\') || path.includes('\0') || blocked(path)) return json({error:'Not found'},404);
      const id = request.headers.get('oai-authenticated-user-id');
      const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
      const ownerEmail = env.CLARITY_OWNER_EMAIL?.trim().toLowerCase();
      const owner = Boolean(id && email && ownerEmail && email === ownerEmail);
      if (path === '/' && url.searchParams.get('workspace') === '1') {
        return Response.redirect(id ? `${url.origin}/` : `${url.origin}/signin-with-chatgpt?return_to=${encodeURIComponent('/')}`,302);
      }

      // Every visitor, including the owner, receives the exact same app bundle.
      // Ownership controls the data APIs, never which interface is rendered.
      const assetPath = path === '/' ? '/index.html' : path;
      const asset = assets[assetPath];
      if (asset) {
        if (!['GET','HEAD'].includes(request.method)) return json({error:'Method not allowed'},405);
        const headers = {...baseHeaders,'Content-Type':asset.type};
        if (asset.encoding) headers['Content-Encoding'] = asset.encoding;
        if (asset.type.startsWith('text/html')) headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com";
        return new Response(request.method === 'HEAD' ? null : Uint8Array.from(atob(asset.body), c => c.charCodeAt(0)), {headers});
      }
      if (!path.startsWith('/api/')) return json({error:'Not found'},404);
      if (!owner) {
        if (request.method === 'GET' && path === '/api/bootstrap') return json(visitor.bootstrap());
        if (request.method === 'GET' && path === '/api/english') return json({cards:[]});
        if (request.method === 'GET' && path === '/api/english/speech/status') return json({ready:false,model:'kokoro-local-v1'});
        const reads = ['/api/study/overview','/api/study/progress','/api/study/open'];
        if (reads.includes(path) && request.method === 'POST') {
          if (request.headers.get('origin') !== url.origin || request.headers.get('x-clarity-request') !== '1' || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Only requests from Clarity are accepted'},403);
          if (path === '/api/study/overview') return json(visitor.overview());
          if (path === '/api/study/open') return json({session:null,visitor:true});
          let input;
          try { input = await request.json(); } catch { return json({error:'Invalid request'},400); }
          const progress = visitor.overview().paths[input?.pathId];
          return progress ? json({topics:progress.topics}) : json({error:'Unknown path'},400);
        }
        return json({error:'Personal learning records and AI require the owner’s signed-in workspace. / 个人学习记录和 AI 需要本人登录，路线可直接浏览。'},401);
      }
      if (!env.CLARITY_BACKEND_ORIGIN || !env.CLARITY_PROXY_KEY || env.CLARITY_PROXY_KEY.length < 32) return json({error:'Personal storage is temporarily unavailable. / 个人存储暂时无法连接。'},503);
      let backend;
      try { backend = new URL(env.CLARITY_BACKEND_ORIGIN); } catch { return json({error:'Storage configuration error'},503); }
      if (backend.protocol !== 'https:' || backend.username || backend.password) return json({error:'Storage configuration error'},503);
      const target = new URL(backend);
      target.pathname = url.pathname; target.search = url.search; target.hash = '';
      const headers = new Headers(request.headers);
      for (const name of [...headers.keys()]) if (name === 'cookie' || name === 'authorization' || name === 'host' || name.startsWith('oai-') || name.startsWith('x-clarity-') && !['x-clarity-request','x-clarity-language'].includes(name)) headers.delete(name);
      headers.set('X-Clarity-Proxy-Key', env.CLARITY_PROXY_KEY);
      try {
        const upstream = await fetch(target, {method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,redirect:'manual'});
        const outgoing = new Headers(upstream.headers); outgoing.delete('set-cookie');
        Object.entries(baseHeaders).forEach(([key,value]) => outgoing.set(key,value));
        return new Response(upstream.body, {status:upstream.status,headers:outgoing});
      } catch { return json({error:'Personal storage is temporarily unavailable. Your saved progress is retained.'},502); }
    },
  };
}
