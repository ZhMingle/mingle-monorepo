export const speechModel='kokoro-82m-v1-q8-pcm16-v1';
export const speechVoices=[{id:'af_heart',name:'Heart · US English',zh:'Heart · 美式英语'},{id:'bf_emma',name:'Emma · British English',zh:'Emma · 英式英语'}] as const;
export type SpeechVoice=typeof speechVoices[number]['id'];
export const speechPreview='Could you give me a hand? I am trying to figure this out.';
export type SpeechClip={url:string;voice:SpeechVoice;cached:boolean};
export function validSpeechVoice(value:unknown):value is SpeechVoice{return speechVoices.some(voice=>voice.id===value);}
