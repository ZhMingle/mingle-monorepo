import {ArrowUpRight,Check,Star,Trash2} from 'lucide-react';
import type {EnglishCard} from '../shared/english.ts';
import {englishTitle,englishMeaning} from '../shared/english.ts';
import {useLanguage} from './language.tsx';
import EnglishAudioButton from './EnglishAudioButton.tsx';
import {playbackKey} from './english-playback.ts';
import type {PlaybackState} from './english-playback.ts';

export type EnglishDetailProps={card:EnglishCard;number?:number;editing:boolean;working:boolean;headingId?:string;playback:PlaybackState;onFavorite:(card:EnglishCard)=>void;onRemove:(card:EnglishCard)=>void;onSpeak:(card:EnglishCard,part:'term'|'example',index?:number)=>void;onLookup:(term:string)=>void};
export default function EnglishCardDetail({card,number,editing,working,headingId,playback,onFavorite,onRemove,onSpeak,onLookup}:EnglishDetailProps){
  const {language}=useLanguage();const zh=language==='zh';const text=(cn:string,en:string)=>zh?cn:en;
  const formation=card.wordFormation;
  const chunk=englishTitle(card);
  const financialCrash=/\bcrash\b.*\b(?:share price|stock market)\b/i.test(chunk);
  const softwareCrash=/\b(?:app|program|computer)\b.*\bcrash(?:es|ed|ing)?\b/i.test(chunk);
  const crashNote=financialCrash||softwareCrash;
  const soundOrigin=crashNote?text('crash 可能源于拟声，模仿重物撞击或碎裂时的巨响。','Crash is probably imitative in origin, suggesting the loud sound of an impact or breakage.'):formation?.soundOrigin;
  const meaningConnection=financialCrash
    ?text('想象重物突然坠地。股价语境保留了“突然、猛烈地往下掉”的画面，所以 crash 是暴跌，比普通的 fall 更重。','Picture something falling hard. In this context, crash means a sudden, severe fall in value, stronger than fall.')
    :softwareCrash?text('把程序想成正在运转的机器。Crash 强调它突然停止运行。这里延伸的是突然失灵的结果。','Picture a machine that abruptly stops running. An app crashes when it suddenly stops working.'):formation?.meaningConnection;
  const etymologyLink=<a href={`https://www.etymonline.com/search?q=${encodeURIComponent(card.term)}`} target="_blank" rel="noreferrer">{text('查词源（词典）','Look up etymology')}<ArrowUpRight size={14}/></a>;
  return <article className="english-detail">
    <div className="english-detail-top"><span className="english-kicker">{text('常用语块，整块记住','LEARN A CHUNK, USE IT TOGETHER')}</span><div><button className="icon-button" disabled={editing} onClick={()=>onFavorite(card)} aria-label={card.favorite?text('取消收藏','Unstar card'):text('收藏卡片','Star card')} aria-pressed={card.favorite}><Star size={19} fill={card.favorite?'currentColor':'none'}/></button><button className="icon-button" disabled={editing} onClick={()=>onRemove(card)} aria-label={text('删除卡片','Delete card')}><Trash2 size={17}/></button></div></div>
    <div className="english-term"><h2 id={headingId} lang="en">{number} · {englishTitle(card)}</h2><EnglishAudioButton playback={playback} target={playbackKey(card.id,'term')} label={text('朗读表达','Read expression aloud')} size={19} onClick={()=>onSpeak(card,'term')}/></div>
    <p className="english-core" lang="en"><strong>{card.term}</strong>{card.partOfSpeech&&<span className="english-pos">{card.partOfSpeech}</span>}{card.pronunciation&&<span>{card.pronunciation}</span>}</p>
    <p className="english-meaning">{englishMeaning(card)}</p>
    {(soundOrigin||meaningConnection)&&<section className="english-memory"><h3>{text('为什么这样用','Why this meaning fits')}</h3><dl>
      {soundOrigin&&<div><dt>{text('拟声来源','Imitative origin')}</dt><dd>{soundOrigin}</dd></div>}
      {meaningConnection&&<div><dt>{text('词义延伸','How the meaning extends')}</dt><dd>{meaningConnection}</dd></div>}
    </dl>{crashNote&&<a href="https://www.oxfordlearnersdictionaries.com/definition/english/crash_2" target="_blank" rel="noreferrer">{text('牛津词典','Oxford Learner’s Dictionaries')}<ArrowUpRight size={14}/></a>}</section>}
    {card.chunk&&card.meaning!==card.chunk.chinese&&<p className="english-core-meaning">{card.term}：{card.meaning}</p>}
    {card.context&&<blockquote className="english-original"><span>{text('你看到的原句','Your context')}</span>{card.context}</blockquote>}
    <section className="english-usage"><h3>{text('什么时候用','When to use it')}</h3><p>{card.usage}</p></section>
    <section className="english-examples"><h3>{text('放进句子里','In a sentence')}</h3>{card.examples.map((example,i)=><div key={i}><span className="english-example-number">{String(i+1).padStart(2,'0')}</span><div><p lang="en">{example.english}</p><span>{example.chinese}</span></div><EnglishAudioButton playback={playback} target={playbackKey(card.id,'example',i)} label={text(`朗读例句 ${i+1}`,`Read example ${i+1} aloud`)} onClick={()=>onSpeak(card,'example',i)}/></div>)}</section>
    {formation&&(formation.etymology||formation.root||formation.affixes)&&<section className="english-memory"><h3>{text('词源与构词','Word origin & formation')}</h3><dl>
      <div><dt>{text('词源','Etymology')}</dt><dd>{formation.etymology||text('暂无可靠的词源说明。','No reliable origin note available.')}</dd></div>
      {formation.root&&<div><dt>{text('词根或词基','Root or base')}</dt><dd>{formation.root}</dd></div>}
      {formation.affixes&&<div><dt>{text('词缀','Affixes')}</dt><dd>{formation.affixes}</dd></div>}
    </dl>{etymologyLink}</section>}
    {card.memory&&<section className="english-memory"><h3>{text('速记','Memory cues')}</h3><dl><div><dt>{text('联想画面','Picture it')}</dt><dd>{card.memory.association}</dd></div>{card.memory.sound&&<div><dt>{text('谐音辅助','Sound association')}</dt><dd>{card.memory.sound}</dd></div>}{!formation&&card.memory.parts&&<div><dt>{text('词根 · 词缀','Roots & affixes')}</dt><dd>{card.memory.parts}</dd></div>}</dl>{!formation&&etymologyLink}</section>}
    <section className="english-pitfall"><h3>{text('顺手记住这一点','One thing to remember')}</h3><p>{card.pitfall}</p>{card.sourceNote&&<p className="english-source-note">{card.sourceNote}</p>}</section>
    {card.sources?.some(source=>source.note)&&<details className="english-source-history"><summary>{text('查看原输入与修改','Original input & corrections')}</summary>{card.sources.filter(source=>source.note).map(source=><div key={source.input}><p lang="en">{source.input}</p><p lang="en">→ {source.english}</p><small>{source.note}</small></div>)}</details>}
    {card.related.length>0&&<section className="english-related"><h3>{card.comparison?text('这些表达怎么选','How to choose between these expressions'):text('顺便认识','You might also use')}</h3><div>{card.related.map(item=><button key={item.term} disabled={working} onClick={()=>onLookup(item.term)}><strong lang="en">{item.term}</strong><span>{item.meaning}</span><ArrowUpRight size={14}/></button>)}</div></section>}
    <footer className="english-detail-footer"><Check size={14}/>{text('已保存','Saved')}<span>AI {text('整理','notes')} · {new Date(card.createdAt).toLocaleDateString(zh?'zh-CN':'en-NZ')}</span></footer>
  </article>;
}
