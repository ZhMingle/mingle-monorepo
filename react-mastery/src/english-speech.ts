export type VoiceInfo={name:string;lang:string;voiceURI:string;localService:boolean};
export function englishVoices<T extends VoiceInfo>(voices:T[]):T[]{
  const score=(voice:T)=>(/natural|neural|premium|enhanced|online/i.test(voice.name)?100:0)+(!voice.localService?30:0)+(/google/i.test(voice.name)?20:0)+(/^en[-_]US$/i.test(voice.lang)?5:0);
  return voices.filter(voice=>/^en(?:[-_]|$)/i.test(voice.lang)).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));
}

export function createEnglishSpeaker(synth:SpeechSynthesis,create:(text:string)=>SpeechSynthesisUtterance,onState:(state:'loading'|'speaking'|'idle'|'error',error?:string)=>void){
  let active:SpeechSynthesisUtterance|null=null;
  let generation=0;
  let timer:ReturnType<typeof setTimeout>|undefined;
  function stop(){generation++;if(timer)clearTimeout(timer);active=null;synth.cancel();}
  function speak(text:string,voiceURI:string,rate:number){
    stop();const ticket=generation;
    function play(fallback=false){
      if(ticket!==generation)return;
      const utterance=create(text);active=utterance; // Keep a strong reference until end/error.
      const voices=englishVoices(synth.getVoices());
      const voice=voices.find(item=>item.voiceURI===voiceURI)||voices[0];
      if(!fallback&&voice)utterance.voice=voice;
      utterance.lang=(!fallback&&voice?.lang)||'en-US';utterance.rate=rate;
      const failed=(error:string)=>{
        if(ticket!==generation||active!==utterance)return;
        if(timer)clearTimeout(timer);
        if(!fallback){active=null;synth.cancel();timer=setTimeout(()=>play(true),60);}
        else{active=null;onState('error',error);}
      };
      utterance.onstart=()=>{if(ticket===generation&&active===utterance){if(timer)clearTimeout(timer);onState('speaking');}};
      utterance.onend=()=>{if(ticket===generation&&active===utterance){if(timer)clearTimeout(timer);active=null;onState('idle');}};
      utterance.onerror=event=>failed(event.error);
      onState('loading');
      timer=setTimeout(()=>failed('start-timeout'),4000);
      try{synth.resume();synth.speak(utterance);}catch(error){failed(String(error));}
    }
    // Let Chromium finish cancelling the previous utterance before enqueueing.
    timer=setTimeout(()=>play(),60);
  }
  return {speak,stop};
}
