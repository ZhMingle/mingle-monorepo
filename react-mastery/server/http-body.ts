export async function readJSONBody(stream:AsyncIterable<Uint8Array|string>,max=100000):Promise<Record<string,unknown>>{
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of stream){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>max)throw Object.assign(new Error('Submission is too large'),{status:413});chunks.push(bytes);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('Invalid JSON body'),{status:400});}
}
