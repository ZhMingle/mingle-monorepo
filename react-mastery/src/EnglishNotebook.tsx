import {useEffect,useState} from 'react';
import {ArrowDownToLine,ArrowUpRight,BookOpen,Check,Headphones,LoaderCircle,Search,Sparkles,Star,Trash2} from 'lucide-react';
import {request} from './api.ts';
import {useLanguage} from './language.tsx';
import type {EnglishCard} from '../shared/english.ts';
import './english-notebook.css';

export default function EnglishNotebook(){
  const {language}=useLanguage();
  const zh=language==='zh';
  const text=(cn:string,en:string)=>zh?cn:en;
  const [cards,setCards]=useState<EnglishCard[]>([]);
  const [selected,setSelected]=useState('');
  const [query,setQuery]=useState('');
  const [context,setContext]=useState('');
  const [filter,setFilter]=useState('');
  const [tab,setTab]=useState<'all'|'word'|'expression'|'favorite'>('all');
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [editing,setEditing]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  async function load(){
    setLoading(true);setError('');
    try{const result=await request<{cards:EnglishCard[]}>('english');setCards(result.cards);setSelected(id=>result.cards.some(c=>c.id===id)?id:result.cards[0]?.id??'');}
    catch(e){setError((e as Error).message);}finally{setLoading(false);}
  }
  useEffect(()=>{void load();return()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();};},[]);
  const active=cards.find(c=>c.id===selected);
  const visible=cards.filter(c=>(tab==='all'||(tab==='favorite'?c.favorite:c.kind===tab))&&[c.term,c.query,c.meaning,c.usage,c.context,...c.examples.flatMap(e=>[e.english,e.chinese])].join(' ').toLocaleLowerCase().includes(filter.toLocaleLowerCase().trim()));
  const today=new Date().toDateString();
  const todayCount=cards.filter(c=>new Date(c.createdAt).toDateString()===today).length;
  async function lookup(value=query,lookupContext=context){
    if(loading||working||!value.trim())return;
    setQuery(value);setWorking(true);setError('');setNotice('');
    try{
      const {card,cached}=await request<{card:EnglishCard;cached:boolean}>('english/lookup',{query:value,context:lookupContext});
      setCards(old=>[card,...old.filter(c=>c.id!==card.id)]);setSelected(card.id);
      setNotice(cached?text('已打开之前整理的卡片。','Opened your saved card.'):text('已整理并保存到你的卡片库。','Organized and saved to your notebook.'));
    }catch(e){setError((e as Error).message);}finally{setWorking(false);}
  }
  async function favorite(card:EnglishCard){
    setEditing(true);setError('');
    try{const result=await request<{card:EnglishCard}>('english/update',{id:card.id,favorite:!card.favorite});setCards(old=>old.map(c=>c.id===card.id?result.card:c));}
    catch(e){setError((e as Error).message);}finally{setEditing(false);}
  }
  async function remove(card:EnglishCard){
    if(!window.confirm(text(`删除“${card.term}”这张卡片？`,`Delete the card for “${card.term}”?`)))return;
    setEditing(true);setError('');
    try{await request('english/delete',{id:card.id});const next=cards.filter(c=>c.id!==card.id);setCards(next);setSelected(next[0]?.id??'');}
    catch(e){setError((e as Error).message);}finally{setEditing(false);}
  }
  function speak(value:string){
    if(!('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(value);utterance.lang='en-US';utterance.rate=.85;window.speechSynthesis.speak(utterance);
  }
  return <div className="english-notebook">
    <div className="page-heading"><div><span className="eyebrow">A LITTLE ENGLISH, EVERY DAY</span><h1>{text('把遇到的英语，变成自己的。','Make everyday English your own.')}<span className="heading-dot">.</span></h1><p>{text('查一个词，记住一种用法。AI 帮你整理，你只管慢慢积累。','Look up a word or expression. Keep a small, useful note for next time.')}</p></div><a className="secondary" href="/api/english/export"><ArrowDownToLine size={16}/>{text('导出卡片','Export cards')}</a></div>
    <section className="english-search-panel" aria-labelledby="english-search-title">
      <span className="english-kicker"><Sparkles size={15}/>{text('今天遇到了什么？','What did you come across today?')}</span>
      <h2 id="english-search-title">{text('一个单词，一句表达，都可以。','A word, a phrase, or something you want to say.')}</h2>
      <form onSubmit={e=>{e.preventDefault();void lookup();}}>
        <label className="english-query"><Search size={21}/><input aria-label={text('查单词或表达','Look up a word or expression')} maxLength={160} value={query} onChange={e=>setQuery(e.target.value)} placeholder={text('例如：figure out / I’m down / 辛苦了','Try: figure out / I’m down / 辛苦了')} required/><button className="dark-button" disabled={working||!query.trim()}>{working?<LoaderCircle className="spin" size={17}/>:<Sparkles size={17}/>} {working?text('正在整理…','Organizing…'):text('查一查，存下来','Look up & save')}</button></label>
        <details className="english-context"><summary>{text('有原句？补充语境会更准确','Have a sentence? Add context for a better explanation')}</summary><label>{text('它出现在哪句话里？（选填）','Where did you see it? (optional)')}<textarea value={context} onChange={e=>setContext(e.target.value)} maxLength={500} rows={2} placeholder="I’m down for coffee after work."/></label></details>
      </form>
      <div className="english-search-foot"><span>{text('英文或中文都能查 · 自动保存 · 再查直接打开','English or Chinese · Automatically saved · Reuse saved cards')}</span><span><strong>{todayCount}</strong> {text('张今日新卡片','new today')}<i/> <strong>{cards.length}</strong> {text('张积累','in your notebook')}</span></div>
    </section>
    {working&&<p className="english-status" role="status"><LoaderCircle className="spin" size={16}/>{text('AI 正在整理意思和例句，通常需要几十秒。','AI is preparing the meaning and examples. This may take a little while.')}</p>}
    {error&&<div className="error-banner" role="alert"><span>{error}</span>{loading?null:<button onClick={()=>void load()}>{text('刷新卡片库','Reload notebook')}</button>}</div>}
    {notice&&<p className="english-status" role="status"><Check size={16}/>{notice}</p>}
    <div className="english-library-heading"><h2><BookOpen size={20}/>{text('我的英语积累','My English notebook')}</h2><span>{text('少一点堆砌，多一点会用。','Small notes. Useful English.')}</span></div>
    <div className="english-library">
      <aside className="english-card-list" aria-label={text('已保存的英语卡片','Saved English cards')}>
        <label className="english-filter"><Search size={16}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={text('搜索已存的卡片','Search saved cards')} aria-label={text('搜索已存的卡片','Search saved cards')}/></label>
        <div className="english-tabs" role="group" aria-label={text('筛选卡片','Filter cards')}>{(['all','word','expression','favorite'] as const).map(id=><button key={id} aria-pressed={tab===id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{({all:text('全部','All'),word:text('单词','Words'),expression:text('表达','Phrases'),favorite:text('收藏','Starred')})[id]}</button>)}</div>
        <div className="english-card-scroll">{loading?<p role="status" className="english-list-empty">{text('正在读取卡片…','Loading cards…')}</p>:visible.length?visible.map(card=><button className={`english-card-item ${selected===card.id?'active':''}`} key={card.id} aria-pressed={selected===card.id} onClick={()=>{setSelected(card.id);setNotice('');}}><span><strong lang="en">{card.term}</strong>{card.favorite&&<Star size={14} fill="currentColor"/>}</span><p>{card.meaning}</p><small>{card.kind==='word'?text('单词','Word'):text('表达','Expression')} · {new Date(card.createdAt).toLocaleDateString(zh?'zh-CN':'en-NZ',{month:'short',day:'numeric'})}</small></button>):<p className="english-list-empty">{cards.length?text('没有符合筛选条件的卡片。','No matching cards.'):text('查过的词和表达会自动出现在这里。','Your words and expressions will appear here.')}</p>}</div>
      </aside>
      {active?<article className="english-detail" key={active.id}>
        <div className="english-detail-top"><span className="english-kicker">{active.kind==='word'?text('一个单词，一点进步','ONE WORD, ONE SMALL STEP'):text('一句表达，多一种说法','ONE MORE WAY TO SAY IT')}</span><div><button className="icon-button" disabled={editing} onClick={()=>void favorite(active)} aria-label={active.favorite?text('取消收藏','Unstar card'):text('收藏卡片','Star card')} aria-pressed={active.favorite}><Star size={19} fill={active.favorite?'currentColor':'none'}/></button><button className="icon-button" disabled={editing} onClick={()=>void remove(active)} aria-label={text('删除卡片','Delete card')}><Trash2 size={17}/></button></div></div>
        <div className="english-term"><h2 lang="en">{active.term}</h2>{'speechSynthesis' in window&&<button className="english-audio" aria-label={text('朗读表达','Read expression aloud')} onClick={()=>speak(active.term)}><Headphones size={19}/></button>}</div>
        {active.pronunciation&&<p className="english-pronunciation" lang="en">{active.pronunciation}</p>}
        <p className="english-meaning">{active.meaning}</p>
        {active.context&&<blockquote className="english-original"><span>{text('你看到的原句','Your context')}</span>{active.context}</blockquote>}
        <section className="english-usage"><h3>{text('什么时候用','When to use it')}</h3><p>{active.usage}</p></section>
        <section className="english-examples"><h3>{text('放进句子里','In a sentence')}</h3>{active.examples.map((example,i)=><div key={i}><span className="english-example-number">0{i+1}</span><div><p lang="en">{example.english}</p><span>{example.chinese}</span></div>{'speechSynthesis' in window&&<button className="english-audio" aria-label={text(`朗读例句 ${i+1}`,`Read example ${i+1} aloud`)} onClick={()=>speak(example.english)}><Headphones size={16}/></button>}</div>)}</section>
        <section className="english-pitfall"><h3>{text('顺手记住这一点','One thing to remember')}</h3><p>{active.pitfall}</p></section>
        {active.related.length>0&&<section className="english-related"><h3>{text('顺便认识','You might also use')}</h3><div>{active.related.map(item=><button key={item.term} disabled={working} onClick={()=>{setContext('');void lookup(item.term,'');}}><strong lang="en">{item.term}</strong><span>{item.meaning}</span><ArrowUpRight size={14}/></button>)}</div></section>}
        <footer className="english-detail-footer"><Check size={14}/>{text('已保存在本机','Saved on this computer')}<span>AI {text('整理','notes')} · {new Date(active.createdAt).toLocaleDateString(zh?'zh-CN':'en-NZ')}</span></footer>
      </article>:<div className="english-welcome"><span className="english-welcome-icon"><BookOpen size={32}/></span><span className="english-kicker">YOUR EVERYDAY WORDS</span><h2>{text('从今天遇到的那个词开始。','Start with a word from your day.')}</h2><p>{text('不必一次学很多。把看过却不会用的表达留在这里，下次遇到，就熟悉一点。','You don’t need a long word list. Save an expression you want to use, and get a little more familiar with it.')}</p><div>{['figure out','I’m down','take your time'].map(term=><button key={term} disabled={working} onClick={()=>{setContext('');void lookup(term,'');}}>{term}<ArrowUpRight size={14}/></button>)}</div><small>{text('每张卡片：简短意思 · 使用场景 · 两个例句 · 一个易错点','Each card: meaning · usage · two examples · one common pitfall')}</small></div>}
    </div>
  </div>;
}
