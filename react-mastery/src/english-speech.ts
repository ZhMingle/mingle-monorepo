export type VoiceInfo={name:string;lang:string;voiceURI:string;localService:boolean};
export function englishVoices<T extends VoiceInfo>(voices:T[]):T[]{
  const score=(voice:T)=>(/natural|neural|premium|enhanced|online/i.test(voice.name)?100:0)+(!voice.localService?30:0)+(/google/i.test(voice.name)?20:0)+(/^en[-_]US$/i.test(voice.lang)?5:0);
  return voices.filter(voice=>/^en(?:[-_]|$)/i.test(voice.lang)).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));
}
