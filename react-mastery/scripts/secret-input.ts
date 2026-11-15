// Read one JSON line without terminal echo; secrets never become shell arguments.
export async function readSecretJSON<T>():Promise<T>{
  const raw=!!process.stdin.isTTY;let buffer='';
  if(raw)process.stdin.setRawMode(true);
  process.stdin.resume();console.log('Ready for private configuration JSON on stdin (input is hidden).');
  try{return await new Promise<T>((resolve,reject)=>{
    const receive=(chunk:Buffer)=>{
      buffer+=chunk.toString('utf8');
      if(buffer.includes('\u0003')){process.stdin.off('data',receive);reject(new Error('Cancelled.'));return;}
      const end=buffer.search(/[\r\n]/);if(end<0)return;
      process.stdin.off('data',receive);
      try{resolve(JSON.parse(buffer.slice(0,end)));}catch(error){reject(error);}
    };
    process.stdin.on('data',receive);
  });}finally{if(raw)process.stdin.setRawMode(false);process.stdin.pause();buffer='';}
}
