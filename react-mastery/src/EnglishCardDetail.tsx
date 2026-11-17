import {ArrowUpRight,Check,Headphones,Star,Trash2} from 'lucide-react';
import type {EnglishCard} from '../shared/english.ts';
import {useLanguage} from './language.tsx';

export type EnglishDetailProps={card:EnglishCard;number?:number;editing:boolean;working:boolean;headingId?:string;onFavorite:(card:EnglishCard)=>void;onRemove:(card:EnglishCard)=>void;onSpeak:(card:EnglishCard,part:'term'|'example',index?:number)=>void;onLookup:(term:string)=>void};
export default function EnglishCardDetail({card,number,editing,working,headingId,onFavorite,onRemove,onSpeak,onLookup}:EnglishDetailProps){
  const {language}=useLanguage();const zh=language==='zh';const text=(cn:string,en:string)=>zh?cn:en;
  return <article className="english-detail">
    <div className="english-detail-top"><span className="english-kicker">{card.kind==='word'?text('一个单词，一点进步','ONE WORD, ONE SMALL STEP'):text('一句表达，多一种说法','ONE MORE WAY TO SAY IT')}</span><div><button className="icon-button" disabled={editing} onClick={()=>onFavorite(card)} aria-label={card.favorite?text('取消收藏','Unstar card'):text('收藏卡片','Star card')} aria-pressed={card.favorite}><Star size={19} fill={card.favorite?'currentColor':'none'}/></button><button className="icon-button" disabled={editing} onClick={()=>onRemove(card)} aria-label={text('删除卡片','Delete card')}><Trash2 size={17}/></button></div></div>
    <div className="english-term"><h2 id={headingId} lang="en">{number} · {card.term}</h2><button className="english-audio" aria-label={text('朗读表达','Read expression aloud')} onClick={()=>onSpeak(card,'term')}><Headphones size={19}/></button></div>
    {card.pronunciation&&<p className="english-pronunciation" lang="en">{card.pronunciation}</p>}
    <p className="english-meaning">{card.meaning}</p>
    {card.context&&<blockquote className="english-original"><span>{text('你看到的原句','Your context')}</span>{card.context}</blockquote>}
    <section className="english-usage"><h3>{text('什么时候用','When to use it')}</h3><p>{card.usage}</p></section>
    <section className="english-examples"><h3>{text('放进句子里','In a sentence')}</h3>{card.examples.map((example,i)=><div key={i}><span className="english-example-number">{String(i+1).padStart(2,'0')}</span><div><p lang="en">{example.english}</p><span>{example.chinese}</span></div><button className="english-audio" aria-label={text(`朗读例句 ${i+1}`,`Read example ${i+1} aloud`)} onClick={()=>onSpeak(card,'example',i)}><Headphones size={16}/></button></div>)}</section>
    <section className="english-pitfall"><h3>{text('顺手记住这一点','One thing to remember')}</h3><p>{card.pitfall}</p></section>
    {card.related.length>0&&<section className="english-related"><h3>{text('顺便认识','You might also use')}</h3><div>{card.related.map(item=><button key={item.term} disabled={working} onClick={()=>onLookup(item.term)}><strong lang="en">{item.term}</strong><span>{item.meaning}</span><ArrowUpRight size={14}/></button>)}</div></section>}
    <footer className="english-detail-footer"><Check size={14}/>{text('已保存','Saved')}<span>AI {text('整理','notes')} · {new Date(card.createdAt).toLocaleDateString(zh?'zh-CN':'en-NZ')}</span></footer>
  </article>;
}
