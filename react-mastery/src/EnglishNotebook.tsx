import {useEffect,useState,useRef} from 'react';
import {ArrowDownToLine,ArrowUpRight,BookOpen,Check,LoaderCircle,Search,Sparkles,Star,Maximize2,X} from 'lucide-react';
import {request} from './api.ts';
import {useLanguage} from './language.tsx';
import type {EnglishCard} from '../shared/english.ts';
import {englishBatchInput} from '../shared/english.ts';
import {englishVoices,isNaturalVoice,createEnglishSpeaker} from './english-speech.ts';
import type {VoiceInfo} from './english-speech.ts';
import {speechVoices,type SpeechVoice,type SpeechClip} from '../shared/english-audio.ts';
import EnglishCardDetail from './EnglishCardDetail.tsx';
import EnglishCardWall from './EnglishCardWall.tsx';
import './english-notebook.css';

export function EnglishNotebookHeading(){
  const {language}=useLanguage();
  return <div className="english-page-title"><h1>{language==='zh'?'把遇到的英语，变成自己的。':'Make everyday English your own.'}<span className="heading-dot">.</span></h1></div>;
}
export default function EnglishNotebook(){
  const {language}=useLanguage();
  const zh=language==='zh';
  const text=(cn:string,en:string)=>zh?cn:en;
  const [cards,setCards]=useState<EnglishCard[]>([]);
  const [selected,setSelected]=useState('');
  const [wallOpen,setWallOpen]=useState(false);
  const wallEntry=useRef<HTMLButtonElement>(null);
  const cardList=useRef<HTMLDivElement>(null);
  const returnPosition=useRef({x:0,y:0,list:0});
  function resetPlayback(){stopSpeech();setAudioURL('');setPlayBlocked(false);setSpeechError('');setPlayedVoice(null);}
  function enterWall(){
    returnPosition.current={x:window.scrollX,y:window.scrollY,list:cardList.current?.scrollTop??0};
    resetPlayback();setWallOpen(true);
  }
  function exitWall(){
    resetPlayback();setWallOpen(false);
    requestAnimationFrame(()=>{
      wallEntry.current?.focus({preventScroll:true});
      if(cardList.current)cardList.current.scrollTop=returnPosition.current.list;
      window.scrollTo(returnPosition.current.x,returnPosition.current.y);
    });
  }
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('');
  const [tab,setTab]=useState<'all'|'word'|'expression'|'favorite'>('all');
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const running=useRef(false);
  const queryInput=useRef<HTMLTextAreaElement>(null);
  const [batch,setBatch]=useState<{query:string;context:string;status:'pending'|'working'|'done'|'failed';error?:string}[]>([]);
  const [editing,setEditing]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI,setVoiceURI]=useState(()=>{try{return localStorage.getItem('clarity.englishVoice')||'';}catch{return '';}});
  const [speechRate,setSpeechRate]=useState(1);
  const [speechState,setSpeechState]=useState<'loading'|'speaking'|'idle'|'error'>('idle');
  const [speechError,setSpeechError]=useState('');
  const [playedVoice,setPlayedVoice]=useState<{voice?:VoiceInfo;fallback:boolean}|null>(null);
  const speaker=useRef<ReturnType<typeof createEnglishSpeaker>|null>(null);
  const [speechEngine,setSpeechEngine]=useState<'neural'|'browser'>('neural');
  const [neuralVoice,setNeuralVoice]=useState<SpeechVoice>(()=>{try{return localStorage.getItem('clarity.neuralVoice')==='bf_emma'?'bf_emma':'af_heart';}catch{return 'af_heart';}});
  const audioRef=useRef<HTMLAudioElement>(null);
  const audioRequest=useRef<AbortController|null>(null);
  const playbackGeneration=useRef(0);
  const [audioURL,setAudioURL]=useState('');
  const [audioLabel,setAudioLabel]=useState('');
  const [audioCached,setAudioCached]=useState(false);
  const [playBlocked,setPlayBlocked]=useState(false);
  function stopSpeech(){playbackGeneration.current++;audioRequest.current?.abort();audioRequest.current=null;speaker.current?.stop();audioRef.current?.pause();setSpeechState('idle');}
  useEffect(()=>()=>{playbackGeneration.current++;audioRequest.current?.abort();audioRef.current?.pause();},[]);
  useEffect(()=>{if(audioRef.current)audioRef.current.playbackRate=speechRate;},[speechRate]);
  useEffect(()=>{
    if(!('speechSynthesis' in window))return;
    const update=()=>setVoices(englishVoices(window.speechSynthesis.getVoices()));
    update();window.speechSynthesis.addEventListener('voiceschanged',update);
    return()=>{window.speechSynthesis.removeEventListener('voiceschanged',update);speaker.current?.stop();speaker.current=null;};
  },[]);
  async function load(){
    setLoading(true);setError('');
    try{const result=await request<{cards:EnglishCard[]}>('english');setCards(result.cards);setSelected(id=>result.cards.some(c=>c.id===id)?id:result.cards[0]?.id??'');}
    catch(e){setError((e as Error).message);}finally{setLoading(false);}
  }
  useEffect(()=>{void load();return()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();};},[]);
  // Stored numbers preserve insertion order; visible ordinals close deletion gaps.
  const orderedCards=cards.toSorted((a,b)=>b.number-a.number);
  const displayNumbers=new Map(orderedCards.map((card,index)=>[card.id,orderedCards.length-index]));
  const active=cards.find(c=>c.id===selected);
  const visible=orderedCards.filter(c=>(tab==='all'||(tab==='favorite'?c.favorite:c.kind===tab))&&[String(displayNumbers.get(c.id)),c.term,c.query,c.meaning,c.usage,c.context,...c.examples.flatMap(e=>[e.english,e.chinese])].join(' ').toLocaleLowerCase().includes(filter.toLocaleLowerCase().trim()));
  const today=new Date().toDateString();
  const todayCount=cards.filter(c=>new Date(c.createdAt).toDateString()===today).length;
  async function lookup(value=query,retry=false){
    if(loading||running.current||!value.trim())return;
    let items:ReturnType<typeof englishBatchInput>;
    try{items=englishBatchInput(value);}catch(e){setError((e as Error).message);return;}
    running.current=true;setWorking(true);setError('');setNotice('');
    if(retry)setBatch(old=>old.map(item=>item.query===items[0].query?{...item,status:'pending',error:undefined}:item));
    else{setQuery(value);setBatch(items.map(item=>({...item,status:'pending'})));}
    let completed=0;
    try{
      for(const item of items){
        const update=(status:'working'|'done'|'failed',error?:string)=>setBatch(old=>old.map(row=>row.query===item.query?{...row,status,error}:row));
        update('working');
        try{
          const {card}=await request<{card:EnglishCard;cached:boolean}>('english/lookup',{query:item.query,context:item.context});
          setCards(old=>[card,...old.filter(c=>c.id!==card.id)]);setSelected(card.id);completed++;update('done');
        }catch(e){update('failed',(e as Error).message);}
      }
      setNotice(text(`已保存／打开 ${completed} 张卡片，失败项可单独重试。`,`Saved or opened ${completed} cards. Failed items can be retried individually.`));
    }finally{running.current=false;setWorking(false);}
  }
  async function favorite(card:EnglishCard){
    setEditing(true);setError('');
    try{const result=await request<{card:EnglishCard}>('english/update',{id:card.id,favorite:!card.favorite});setCards(old=>old.map(c=>c.id===card.id?result.card:c));}
    catch(e){setError((e as Error).message);}finally{setEditing(false);}
  }
  async function remove(card:EnglishCard){
    if(!window.confirm(text(`删除“${card.term}”这张卡片？`,`Delete the card for “${card.term}”?`)))return;
    resetPlayback();setEditing(true);setError('');
    try{await request('english/delete',{id:card.id});const next=cards.filter(c=>c.id!==card.id);setCards(next);setSelected(id=>id===card.id?next[0]?.id??'':id);}
    catch(e){setError((e as Error).message);}finally{setEditing(false);}
  }
  async function speak(value:string,part:'preview'|'term'|'example'='term',index?:number,cardId=active?.id){
    stopSpeech();setSpeechError('');setPlayBlocked(false);setPlayedVoice(null);
    if(speechEngine==='neural'){
      const generation=playbackGeneration.current,controller=new AbortController();audioRequest.current=controller;
      setSpeechState('loading');setAudioURL('');setAudioLabel(value);
      try{
        const clip=await request<SpeechClip>('english/speech',{cardId,part,index,voice:neuralVoice},controller.signal);
        if(playbackGeneration.current!==generation)return;
        const audio=audioRef.current;if(!audio)return;
        setAudioURL(clip.url);setAudioCached(clip.cached);audio.src=clip.url;audio.playbackRate=speechRate;
        try{await audio.play();}catch(cause){if(playbackGeneration.current===generation){setSpeechState('idle');if((cause as Error).name==='NotAllowedError')setPlayBlocked(true);else{setSpeechState('error');setSpeechError(text('音频未能播放，请重试。','Audio could not play. Please retry.'));}}}
      }catch(cause){if(!controller.signal.aborted&&playbackGeneration.current===generation){setSpeechState('error');setSpeechError((cause as Error).message);}}
      return;
    }
    if(!('speechSynthesis' in window)){setSpeechState('error');setSpeechError('unsupported');return;}
    speaker.current??=createEnglishSpeaker(window.speechSynthesis,value=>new SpeechSynthesisUtterance(value),(state,error)=>{setSpeechState(state);setSpeechError(error||'');},(voice,fallback)=>setPlayedVoice({voice,fallback}));
    speaker.current.speak(value,voiceURI,speechRate);
  }
  const readCard=(card:EnglishCard,part:'term'|'example',index?:number)=>void speak(part==='term'?card.term:card.examples[index!].english,part,index,card.id);
  const voiceSettings=(<div className="english-voice-settings"><label>{text('朗读方式','Speech source')} <select value={speechEngine} onChange={e=>{stopSpeech();setAudioURL('');setSpeechError('');setPlayedVoice(null);setSpeechEngine(e.target.value as 'neural'|'browser');}}><option value="neural">{text('自然语音（本机模型）','Neural speech (local model)')}</option>{'speechSynthesis' in window&&<option value="browser">{text('浏览器语音（备用）','Browser speech (backup)')}</option>}</select></label>
      {speechEngine==='neural'?<label>{text('声音','Voice')} <select value={neuralVoice} onChange={e=>{stopSpeech();setAudioURL('');setNeuralVoice(e.target.value as SpeechVoice);try{localStorage.setItem('clarity.neuralVoice',e.target.value);}catch{}}}>{speechVoices.map(voice=><option key={voice.id} value={voice.id}>{zh?voice.zh:voice.name}</option>)}</select></label>:<label>{text('浏览器声音','Browser voice')} <select value={voices.some(voice=>voice.voiceURI===voiceURI)?voiceURI:''} onChange={e=>{stopSpeech();setVoiceURI(e.target.value);try{localStorage.setItem('clarity.englishVoice',e.target.value);}catch{}}}><option value="">{text('自动选择','Automatic')}</option>{voices.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>}
      <label>{text('语速','Speed')} <select value={speechRate} onChange={e=>setSpeechRate(Number(e.target.value))}><option value={.85}>{text('稍慢','Slower')}</option><option value={1}>{text('正常','Normal')}</option><option value={1.1}>{text('稍快','Faster')}</option></select></label><button onClick={()=>void speak('Could you give me a hand? I am trying to figure this out.','preview')}>{text('试听声音','Preview voice')}</button>
      {speechEngine==='browser'&&<small>{voices.some(isNaturalVoice)?text('使用浏览器提供的英语声音。','Uses English voices supplied by your browser.'):text('当前浏览器没有自然英语音色，备用声音可能较机械。','This browser has no natural English voice; backup speech may sound robotic.')}</small>}
    </div>);
  const playback=(<><div className="english-neural-player" hidden={speechEngine!=='neural'||!audioURL}><p>{audioLabel} <small>· Kokoro · {audioCached?text('已缓存','Cached'):text('新生成','New clip')}</small></p><audio ref={audioRef} controls preload="none" aria-label={text('自然语音播放器','Neural speech player')} onPlaying={()=>setSpeechState('speaking')} onPause={()=>setSpeechState(state=>state==='speaking'?'idle':state)} onEnded={()=>setSpeechState('idle')} onError={()=>{if(audioRef.current?.getAttribute('src')){setSpeechState('error');setSpeechError(text('音频加载失败，请重新点击朗读按钮。','Audio could not load. Tap the reading button again.'));}}}/></div>
      {playBlocked&&<p role="status">{text('音频已准备好，请点击播放器的播放按钮。','Audio is ready. Tap Play in the audio player.')}</p>}
      {playedVoice&&<p className="english-voice-status" role="status">{text('上次实际使用：','Last voice used: ')}{playedVoice.voice?.name??text('浏览器默认英语声音','Browser default English voice')}{playedVoice.fallback&&text('（前一个音色不可用，已切换）',' (the previous voice was unavailable)')}</p>}
      {(speechState==='loading'||speechState==='speaking')&&<button className="secondary" onClick={stopSpeech}>{text('停止朗读','Stop reading')}</button>}
      {speechState==='error'&&<p role="alert">{speechError}</p>}
      {(speechState==='loading'||speechState==='speaking')&&<p role="status">{speechState==='loading'?(speechEngine==='neural'?text('正在准备自然语音，首次生成需要稍等…','Preparing neural speech; the first generation may take a moment…'):text('正在启动朗读…','Starting speech…')):text('正在朗读…','Speaking…')}</p>}</>);
  return <div className="english-notebook">
    <section className="english-search-panel" aria-labelledby="english-search-title">
      <div className="english-search-heading"><div><span className="english-kicker"><Sparkles size={15}/>{text('今天遇到了什么？','What did you come across today?')}</span><h2 id="english-search-title">{text('单词、短语、原句，都能记下来。','Save words, phrases or whole sentences.')}</h2></div><a className="secondary" href="/api/english/export"><ArrowDownToLine size={16}/>{text('导出卡片','Export cards')}</a></div>
      <form onSubmit={e=>{e.preventDefault();void lookup();}}>
        <div className="english-entry-row"><div className="english-query"><textarea ref={queryInput} aria-label={text('输入单词、短语或英文原句','Enter words, phrases or English sentences')} maxLength={10000} rows={2} disabled={working} value={query} onChange={e=>setQuery(e.target.value)} placeholder={text('输入单词、短语或完整英文句子…','Enter a word, phrase or complete English sentence…')} required/>{query&&<button type="button" className="english-clear" disabled={working} aria-label={text('清空输入','Clear input')} title={text('清空输入','Clear input')} onClick={()=>{setQuery('');setError('');setNotice('');queryInput.current?.focus();}}><X size={18}/></button>}</div><button type="submit" className="dark-button english-generate-button" disabled={loading||working||!query.trim()}>{working?<LoaderCircle className="spin" size={17}/>:<Sparkles size={17}/>} {working?text('正在生成…','Generating…'):text('生成并保存卡片','Generate & save cards')}</button></div>
      </form>
      <div className="english-search-foot"><span><strong>{todayCount}</strong> {text('张今日新卡片','new today')}<i/> <strong>{cards.length}</strong> {text('张积累','in your notebook')}</span></div>
    </section>
    {batch.length>0&&<section className="english-batch" aria-label={text('生成进度','Generation progress')}><p role="status">{text('生成进度','Progress')}：{batch.filter(item=>item.status==='done'||item.status==='failed').length}/{batch.length} · {text('已保存／打开','Saved or opened')} {batch.filter(item=>item.status==='done').length}</p><ul>{batch.map(item=><li key={item.query}><strong>{item.query}</strong><span>{({pending:text('等待生成','Queued'),working:text('正在生成…','Generating…'),done:text('已保存／打开','Saved or opened'),failed:text('生成失败','Failed')})[item.status]}</span>{item.error&&<span role="alert">{item.error}</span>}{item.status==='failed'&&<button disabled={working} onClick={()=>void lookup(item.query,true)}>{text('重试此项','Retry this item')}</button>}</li>)}</ul></section>}
    {error&&<div className="error-banner" role="alert"><span>{error}</span>{loading?null:<button onClick={()=>void load()}>{text('刷新卡片库','Reload notebook')}</button>}</div>}
    {notice&&<p className="english-status" role="status"><Check size={16}/>{notice}</p>}
    <div className="english-library-heading"><h2><BookOpen size={20}/>{text('我的英语积累','My English notebook')}</h2><button ref={wallEntry} className="secondary" onClick={enterWall}><Maximize2 size={17}/>{text('全屏卡片','Full-screen cards')}</button></div>
    {!wallOpen&&<>{voiceSettings}{playback}</>}
    <div className="english-library">
      <aside className="english-card-list" aria-label={text('已保存的英语卡片','Saved English cards')}>
        <label className="english-filter"><Search size={16}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={text('搜索已存的卡片','Search saved cards')} aria-label={text('搜索已存的卡片','Search saved cards')}/></label>
        <div className="english-tabs" role="group" aria-label={text('筛选卡片','Filter cards')}>{(['all','word','expression','favorite'] as const).map(id=><button key={id} aria-pressed={tab===id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{({all:text('全部','All'),word:text('单词','Words'),expression:text('表达','Phrases'),favorite:text('收藏','Starred')})[id]}</button>)}</div>
        <div className="english-card-scroll" ref={cardList}>{loading?<p role="status" className="english-list-empty">{text('正在读取卡片…','Loading cards…')}</p>:visible.length?visible.map(card=><button className={`english-card-item ${selected===card.id?'active':''}`} key={card.id} aria-pressed={selected===card.id} onClick={()=>{setSelected(card.id);setNotice('');}}><span><strong lang="en">{displayNumbers.get(card.id)} · {card.term}</strong>{card.favorite&&<Star size={14} fill="currentColor"/>}</span><p>{card.meaning}</p><small>{card.kind==='word'?text('单词','Word'):text('表达','Expression')} · {new Date(card.createdAt).toLocaleDateString(zh?'zh-CN':'en-NZ',{month:'short',day:'numeric'})}</small></button>):<p className="english-list-empty">{cards.length?text('没有符合筛选条件的卡片。','No matching cards.'):text('查过的词和表达会自动出现在这里。','Your words and expressions will appear here.')}</p>}</div>
      </aside>
      {active?<EnglishCardDetail card={active} number={displayNumbers.get(active.id)} editing={editing} working={working} onFavorite={card=>void favorite(card)} onRemove={card=>void remove(card)} onSpeak={readCard} onLookup={term=>void lookup(term)}/>:<div className="english-welcome"><span className="english-welcome-icon"><BookOpen size={32}/></span><span className="english-kicker">YOUR EVERYDAY WORDS</span><h2>{text('从今天遇到的那个词开始。','Start with a word from your day.')}</h2><p>{text('不必一次学很多。把看过却不会用的表达留在这里，下次遇到，就熟悉一点。','You don’t need a long word list. Save an expression you want to use, and get a little more familiar with it.')}</p><div>{['figure out','I’m down','take your time'].map(term=><button key={term} disabled={working} onClick={()=>void lookup(term)}>{term}<ArrowUpRight size={14}/></button>)}</div><small>{text('每张卡片：简短意思 · 使用场景 · 例句 · 一个易错点','Each card: meaning · usage · examples · one common pitfall')}</small></div>}
    </div>
    {wallOpen&&<EnglishCardWall cards={cards} visible={visible} numbers={displayNumbers} filter={filter} onFilter={setFilter} tab={tab} onTab={setTab} loading={loading} editing={editing} working={working} error={error} onReload={()=>void load()} onExit={exitWall} onResetPlayback={resetPlayback} voiceSettings={voiceSettings} playback={playback} onFavorite={card=>void favorite(card)} onRemove={card=>void remove(card)} onSpeak={readCard} onLookup={term=>{exitWall();void lookup(term);}}/>}
  </div>;
}
