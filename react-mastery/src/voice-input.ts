export interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
export interface RecognitionResults { length:number; [index:number]:RecognitionResult }
export interface RecognitionService {
  lang:string; continuous:boolean; interimResults:boolean;
  onresult:((event:{results:RecognitionResults})=>void)|null;
  onerror:((event:{error:string})=>void)|null;
  onend:(()=>void)|null; start():void; stop():void; abort():void;
}
export type RecognitionConstructor = new()=>RecognitionService;
export function recognitionConstructor():RecognitionConstructor|undefined {
  const browser=window as unknown as {SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}
export function recognitionText(results:RecognitionResults) {
  let final=''; let interim='';
  for(let i=0;i<results.length;i++) {
    const transcript=results[i][0].transcript;
    if(results[i].isFinal) final+=transcript+' '; else interim+=transcript;
  }
  return {final:final.trim(),interim:interim.trim()};
}
