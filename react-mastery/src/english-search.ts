import {englishMeaning,englishTermKey,englishTitle} from '../shared/english.ts';
import type {EnglishCard} from '../shared/english.ts';

export type EnglishCardFilter='all'|'word'|'expression'|'favorite';

// The incoming order is the notebook order; keep it for equally relevant matches.
export function searchEnglishCards(cards:readonly EnglishCard[],query:string,tab:EnglishCardFilter,numbers:ReadonlyMap<string,number>):EnglishCard[]{
  const needle=englishTermKey(query);
  return cards.flatMap((card,index)=>{
    if(tab!=='all'&&(tab==='favorite'?!card.favorite:card.kind!==tab))return [];
    if(!needle)return [{card,index,rank:0}];
    const names=[card.term,englishTitle(card)].map(englishTermKey);
    const meanings=[card.meaning,englishMeaning(card)].map(englishTermKey);
    const notes=[card.query,card.context,card.usage,card.partOfSpeech??'',...card.examples.flatMap(example=>[example.english,example.chinese])].map(englishTermKey);
    const rank=String(numbers.get(card.id))===needle||names.includes(needle)?0:names.some(name=>name.startsWith(needle))?1:names.some(name=>name.includes(needle))?2:meanings.some(meaning=>meaning.includes(needle))?3:notes.some(note=>note.includes(needle))?4:Infinity;
    return Number.isFinite(rank)?[{card,index,rank}]:[];
  }).sort((a,b)=>a.rank-b.rank||a.index-b.index).map(match=>match.card);
}

export function visibleEnglishCard(cards:readonly EnglishCard[],preferredId:string):EnglishCard|undefined{
  return cards.find(card=>card.id===preferredId)??cards[0];
}
