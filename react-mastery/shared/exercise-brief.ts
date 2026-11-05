// Keep the original task available; never shorten by deleting constraints.
export function exerciseBrief(source:string){
  if(source.includes('```'))return {lead:source,expanded:false};
  let inline=false;
  for(let i=0;i<source.length;i++){
    const char=source[i];
    if(char==='`')inline=!inline;
    if(!inline&&(/[。！？\n]/.test(char)||(char==='.'&&/\s/.test(source[i+1]??'')))){
      const lead=source.slice(0,i+1).trim();
      if(lead&&source.slice(i+1).trim())return {lead,expanded:true};
    }
  }
  return {lead:source,expanded:false};
}
