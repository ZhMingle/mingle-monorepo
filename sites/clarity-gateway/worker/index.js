// Sites dispatch supplies the owner's sign-in boundary. No user token is sent upstream.
export default {
  async fetch(request,env){
    if(!request.headers.get('oai-authenticated-user-id'))return new Response('Sign in with ChatGPT to continue.',{status:401});
    if(!env.CLARITY_BACKEND_ORIGIN||!env.CLARITY_PROXY_KEY||env.CLARITY_PROXY_KEY.length<32)return new Response('Clarity is being configured.',{status:503});
    const original=new URL(request.url);
    if(original.pathname.startsWith('/api/bridge/')||original.pathname.startsWith('/api/admin/')||original.pathname==='/healthz')return new Response('Not found',{status:404});
    const backend=new URL(env.CLARITY_BACKEND_ORIGIN);
    if(backend.protocol!=='https:')return new Response('Invalid backend configuration.',{status:503});
    const target=new URL(original.pathname+original.search,backend);
    const headers=new Headers(request.headers);
    for(const name of [...headers.keys()])if(name==='cookie'||name==='authorization'||name.startsWith('oai-')||name.startsWith('x-clarity-')&&!['x-clarity-request','x-clarity-language'].includes(name)||name==='host')headers.delete(name);
    headers.set('X-Clarity-Proxy-Key',env.CLARITY_PROXY_KEY);
    try{
      const upstream=await fetch(target,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,redirect:'manual'});
      const outgoing=new Headers(upstream.headers);outgoing.delete('set-cookie');outgoing.set('Cache-Control','private, no-store');outgoing.set('X-Content-Type-Options','nosniff');
      return new Response(upstream.body,{status:upstream.status,headers:outgoing});
    }catch{return new Response('Clarity is temporarily unavailable. Your saved progress remains stored.',{status:502});}
  }
};
