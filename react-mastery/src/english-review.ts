import {englishTitle} from '../shared/english.ts';
import type {EnglishCard} from '../shared/english.ts';
import {playbackKey} from './english-playback.ts';
import type {SpeechSelection} from './english-playback.ts';
export function reviewQueue(cards:EnglishCard[],start:number,repetitions:number,automatic:boolean,firstRepeat=1):SpeechSelection[]{
  if(!Number.isInteger(repetitions)||repetitions<1||repetitions>20||!Number.isInteger(start)||start<0||start>=cards.length||!Number.isInteger(firstRepeat)||firstRepeat<1||firstRepeat>repetitions)throw new Error('Invalid review settings.');
  return cards.slice(start,automatic?undefined:start+1).flatMap((card,index)=>Array.from({length:repetitions-(index===0?firstRepeat-1:0)},(_,offset)=>({key:playbackKey(card.id,'term'),cardId:card.id,part:'term' as const,text:englishTitle(card),iteration:offset+(index===0?firstRepeat:1),repetitions})));
}
