export type VoiceInfo={name:string;lang:string;voiceURI:string;localService:boolean};
export const isNaturalVoice=(voice:VoiceInfo)=>/natural|neural|premium|enhanced/i.test(voice.name);
export function englishVoices<T extends VoiceInfo>(voices:T[]):T[]{
  const score=(voice:T)=>(isNaturalVoice(voice)?100:0)+(!voice.localService?30:0)+(/google/i.test(voice.name)?20:0)+(/^en[-_]US$/i.test(voice.lang)?5:0);
  return voices.filter(voice=>/^en(?:[-_]|$)/i.test(voice.lang)).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));
}

export function createEnglishSpeaker(synth:SpeechSynthesis,create:(text:string)=>SpeechSynthesisUtterance,onState:(state:'loading'|'speaking'|'idle'|'error',error?:string)=>void,onVoice?:(voice:VoiceInfo|undefined,fallback:boolean)=>void){
  let active:SpeechSynthesisUtterance|null=null;
  let generation=0;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let waitingForVoices:(()=>void)|undefined;
  function clearWait(){if(waitingForVoices)synth.removeEventListener('voiceschanged',waitingForVoices);waitingForVoices=undefined;}
  function stop(){generation++;if(timer)clearTimeout(timer);clearWait();active=null;synth.cancel();onState('idle');}
  function speak(text:string,voiceURI:string,rate:number){
    stop();const ticket=generation;
    function prepare(){
      if(ticket!==generation)return;
      clearWait();if(timer)clearTimeout(timer);
      const available=englishVoices(synth.getVoices());
      const chosen=available.find(voice=>voice.voiceURI===voiceURI);
      // Try other recommended voices before a clearly reported system fallback.
      const preferred=[...(chosen?[chosen]:[]),...available.filter(isNaturalVoice),...available.filter(voice=>!voice.localService)];
      const candidates=[...new Map(preferred.map(voice=>[voice.voiceURI,voice])).values()].slice(0,3);
      const system=available.find(voice=>voice.localService&&!isNaturalVoice(voice)&&!candidates.some(candidate=>candidate.voiceURI===voice.voiceURI));
      if(system)candidates.push(system);
      if(!candidates.length)candidates.push(...available.slice(0,2));
      timer=setTimeout(()=>play(candidates,0),60);
    }
    function play(candidates:SpeechSynthesisVoice[],index:number){
      if(ticket!==generation)return;
      const utterance=create(text);active=utterance; // Keep a strong reference until end/error.
      const voice=candidates[index];
      if(voice)utterance.voice=voice;
      utterance.lang=voice?.lang||'en-US';utterance.rate=rate;
      const failed=(error:string)=>{
        if(ticket!==generation||active!==utterance)return;
        if(timer)clearTimeout(timer);
        if(index+1<candidates.length){active=null;synth.cancel();timer=setTimeout(()=>play(candidates,index+1),60);}
        else{active=null;onState('error',error);}
      };
      utterance.onstart=()=>{if(ticket===generation&&active===utterance){if(timer)clearTimeout(timer);onVoice?.(voice,index>0);onState('speaking');}};
      utterance.onend=()=>{if(ticket===generation&&active===utterance){if(timer)clearTimeout(timer);active=null;onState('idle');}};
      utterance.onerror=event=>failed(event.error);
      onState('loading');
      timer=setTimeout(()=>failed('start-timeout'),voice&&!voice.localService?12000:4000);
      try{synth.resume();synth.speak(utterance);}catch(error){failed(String(error));}
    }
    onState('loading');
    if(englishVoices(synth.getVoices()).length)prepare();
    else{
      // The voice inventory can arrive after the user's first click.
      waitingForVoices=()=>{if(englishVoices(synth.getVoices()).length)prepare();};
      synth.addEventListener('voiceschanged',waitingForVoices);
      timer=setTimeout(prepare,1500);
    }
  }
  return {speak,stop};
}
