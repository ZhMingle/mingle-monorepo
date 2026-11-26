import {useEffect,useState,useRef} from 'react';
import {ArrowDownToLine,ArrowUpRight,BookOpen,Check,LoaderCircle,Search,Sparkles,Star,Maximize2,X,GalleryHorizontalEnd} from 'lucide-react';
import {request} from './api.ts';
import {useLanguage} from './language.tsx';
import type {EnglishCard,EnglishLookupItem} from '../shared/english.ts';
import {englishBatchInput,englishTermKey,englishTitle,englishMeaning,hasEnglishLearning,needsEnglishPlan} from '../shared/english.ts';
import {englishVoices,isNaturalVoice} from './english-speech.ts';
import {createEnglishPlayback,idlePlayback,playbackKey} from './english-playback.ts';
import type {PlaybackState} from './english-playback.ts';
import EnglishAudioButton,{EnglishPlaybackNotice} from './EnglishAudioButton.tsx';
import {speechVoices,type SpeechVoice,type SpeechClip} from '../shared/english-audio.ts';
import EnglishCardDetail from './EnglishCardDetail.tsx';
import EnglishCardWall from './EnglishCardWall.tsx';
import EnglishReview from './EnglishReview.tsx';
import EnglishImageInput from './EnglishImageInput.tsx';
import {appendOcrText,clipboardImage} from './english-ocr.ts';
import type {SpeechSelection} from './english-playback.ts';
import {searchEnglishCards,visibleEnglishCard} from './english-search.ts';
import type {EnglishCardFilter} from './english-search.ts';
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
  const [searchSelected,setSearchSelected]=useState('');
  const [wallOpen,setWallOpen]=useState(false);
  const [reviewOpen,setReviewOpen]=useState(false);
  const [enriching,setEnriching]=useState(false),[enrichProgress,setEnrichProgress]=useState({done:0,total:0}),[enrichError,setEnrichError]=useState('');
  const enrichingRun=useRef(false);
  const wallEntry=useRef<HTMLButtonElement>(null);
  const cardList=useRef<HTMLDivElement>(null);
  const returnPosition=useRef({x:0,y:0,list:0});
  function resetPlayback(){player.current?.stop();}
  function enterReview(){resetPlayback();setReviewOpen(true);}
  function exitReview(){resetPlayback();setReviewOpen(false);}
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
  const [ocrImage,setOcrImage]=useState<File|null>(null);
  const queryRevision=useRef(0);
  function editQuery(value:string){queryRevision.current++;setQuery(value);}
  const [filter,setFilter]=useState('');
  const [tab,setTab]=useState<EnglishCardFilter>('all');
  function changeFilter(value:string){setFilter(value);setSearchSelected('');setSelected('');}
  function changeTab(value:EnglishCardFilter){setTab(value);setSearchSelected('');setSelected('');}
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const running=useRef(false);
  const queryInput=useRef<HTMLTextAreaElement>(null);
  const [batch,setBatch]=useState<(EnglishLookupItem&{status:'pending'|'working'|'done'|'failed';error?:string})[]>([]);
  const [editing,setEditing]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI,setVoiceURI]=useState(()=>{try{return localStorage.getItem('clarity.englishVoice')||'';}catch{return '';}});
  const [speechRate,setSpeechRate]=useState(1);
  const [playback,setPlayback]=useState<PlaybackState>(idlePlayback);
  const player=useRef<ReturnType<typeof createEnglishPlayback>|null>(null);
  const mounted=useRef(true);
  const [speechEngine,setSpeechEngine]=useState<'neural'|'browser'>('neural');
  const [neuralVoice,setNeuralVoice]=useState<SpeechVoice>(()=>{try{return localStorage.getItem('clarity.neuralVoice')==='bf_emma'?'bf_emma':'af_heart';}catch{return 'af_heart';}});
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;player.current?.dispose();player.current=null;};},[]);
  useEffect(()=>{player.current?.setRate(speechRate);},[speechRate]);
  useEffect(()=>{
    if(!('speechSynthesis' in window))return;
    const update=()=>setVoices(englishVoices(window.speechSynthesis.getVoices()));
    update();window.speechSynthesis.addEventListener('voiceschanged',update);
    return()=>window.speechSynthesis.removeEventListener('voiceschanged',update);
  },[]);
  async function load(){
    setLoading(true);setError('');
    try{const result=await request<{cards:EnglishCard[]}>('english');setCards(result.cards);setSelected(id=>result.cards.some(c=>c.id===id)?id:result.cards[0]?.id??'');void enrichLibrary(result.cards);}
    catch(e){setError((e as Error).message);}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function enrichLibrary(library=cards){
    if(enrichingRun.current)return;
    const missing=library.filter(card=>!hasEnglishLearning(card));if(!missing.length)return;
    enrichingRun.current=true;setEnriching(true);setEnrichError('');setEnrichProgress({done:0,total:missing.length});
    try{for(let index=0;index<missing.length&&mounted.current;index+=6){
      const result=await request<{cards:EnglishCard[]}>('english/enrich',{ids:missing.slice(index,index+6).map(card=>card.id)});
      if(!mounted.current)break;
      setCards(old=>old.map(card=>{const enriched=result.cards.find(item=>item.id===card.id);return enriched?{...card,partOfSpeech:enriched.partOfSpeech,chunk:enriched.chunk,memory:enriched.memory}:card;}));
      setEnrichProgress({done:Math.min(index+6,missing.length),total:missing.length});
    }}catch(cause){if(mounted.current)setEnrichError((cause as Error).message);}finally{enrichingRun.current=false;if(mounted.current)setEnriching(false);}
  }
  // Stored numbers preserve insertion order; visible ordinals close deletion gaps.
  const orderedCards=cards.toSorted((a,b)=>b.number-a.number);
  const displayNumbers=new Map(orderedCards.map((card,index)=>[card.id,orderedCards.length-index]));
  const visible=searchEnglishCards(orderedCards,filter,tab,displayNumbers);
  // Background generation and speech may select a card, but cannot replace a search result.
  const active=visibleEnglishCard(visible,filter.trim()||tab!=='all'?searchSelected:selected);
  const today=new Date().toDateString();
  const todayCount=cards.filter(c=>new Date(c.createdAt).toDateString()===today).length;
  async function lookup(value=query,retry:EnglishLookupItem|false=false,remind=true){
    if(loading||running.current||!value.trim())return;
    running.current=true;setWorking(true);setError('');setNotice('');
    if(!retry){setQuery(value);setBatch([]);}
    const submittedRevision=queryRevision.current;
    let completed=0;const reminders:EnglishCard[]=[];
    if(remind)resetPlayback();
    try{
      let items:EnglishLookupItem[]=retry?[retry]:englishBatchInput(value);
      if(!retry&&needsEnglishPlan(items)){
        setNotice(text('正在整理知识点…','Organizing learning points…'));
        ({items}=await request<{items:EnglishLookupItem[]}>('english/plan',{value}));
        setNotice('');
      }
      if(retry)setBatch(old=>old.map(item=>item.query===retry.query?{...item,status:'pending',error:undefined}:item));
      else setBatch(items.map(item=>({...item,status:'pending'})));
      for(const item of items){
        const update=(status:'working'|'done'|'failed',error?:string)=>setBatch(old=>old.map(row=>row.query===item.query?{...row,status,error}:row));
        update('working');
        try{
          const {card,cached}=await request<{card:EnglishCard;cached:boolean}>('english/lookup',{query:item.query,context:item.context,comparison:item.comparison});
          setCards(old=>[card,...old.filter(c=>c.id!==card.id)]);setSelected(card.id);completed++;update('done');
          if(remind&&cached&&[card.term,card.query].some(value=>englishTermKey(value)===englishTermKey(item.query)))reminders.push(card);
        }catch(e){update('failed',(e as Error).message);}
      }
      if(!retry&&completed===items.length)setQuery(current=>queryRevision.current===submittedRevision&&current===value?'':current);
      setNotice(text(`已保存／打开 ${completed} 张卡片，失败项可单独重试。`,`Saved or opened ${completed} cards. Failed items can be retried individually.`));
    }catch(e){setNotice('');setError((e as Error).message);}finally{running.current=false;setWorking(false);}
    if(reminders.length&&mounted.current)ensurePlayer().sequence(reminders.map(card=>({key:playbackKey(card.id,'term'),cardId:card.id,part:'reminder',text:card.term,label:card.term})),speechOptions());
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
  const speechOptions=()=>({engine:speechEngine,voice:speechEngine==='neural'?neuralVoice:voiceURI,rate:speechRate});
  function ensurePlayer(){
    return player.current??=createEnglishPlayback({
      loadClip:(selection,voice,signal)=>request<SpeechClip>('english/speech',{cardId:selection.cardId,part:selection.part,index:selection.index,reminderId:selection.reminderId,voice},signal),
      prepare:async(selection,signal)=>{const message=await request<{id:string;text:string}>('english/reminder',{cardId:selection.cardId},signal);return {...selection,text:message.text,reminderId:message.id};},
      createAudio:()=>new Audio(),synth:'speechSynthesis' in window?window.speechSynthesis:undefined,
      createUtterance:content=>new SpeechSynthesisUtterance(content),onChange:state=>{setPlayback(state);if(state.part==='reminder'&&state.phase==='loading'&&state.cardId)setSelected(state.cardId);}
    });
  }
  function speak(value:string,part:'preview'|'term'|'example'='term',index?:number,cardId=active?.id){
    ensurePlayer().toggle({key:playbackKey(part==='preview'?undefined:cardId,part,index),text:value,cardId,part,index},{engine:speechEngine,voice:speechEngine==='neural'?neuralVoice:voiceURI,rate:speechRate});
  }
  const readCard=(card:EnglishCard,part:'term'|'example',index?:number)=>void speak(part==='term'?englishTitle(card):card.examples[index!].english,part,index,card.id);
  const reviewSequence=(items:SpeechSelection[])=>ensurePlayer().sequence(items,speechOptions());
  const voiceSettings=(<div className="english-voice-settings"><label>{text('朗读方式','Speech source')} <select value={speechEngine} onChange={e=>{resetPlayback();setSpeechEngine(e.target.value as 'neural'|'browser');}}><option value="neural">{text('自然语音（本机模型）','Neural speech (local model)')}</option>{'speechSynthesis' in window&&<option value="browser">{text('浏览器语音（备用）','Browser speech (backup)')}</option>}</select></label>
      {speechEngine==='neural'?<label>{text('声音','Voice')} <select value={neuralVoice} onChange={e=>{resetPlayback();setNeuralVoice(e.target.value as SpeechVoice);try{localStorage.setItem('clarity.neuralVoice',e.target.value);}catch{}}}>{speechVoices.map(voice=><option key={voice.id} value={voice.id}>{zh?voice.zh:voice.name}</option>)}</select></label>:<label>{text('浏览器声音','Browser voice')} <select value={voices.some(voice=>voice.voiceURI===voiceURI)?voiceURI:''} onChange={e=>{resetPlayback();setVoiceURI(e.target.value);try{localStorage.setItem('clarity.englishVoice',e.target.value);}catch{}}}><option value="">{text('自动选择','Automatic')}</option>{voices.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>}
      <label>{text('语速','Speed')} <select value={speechRate} onChange={e=>setSpeechRate(Number(e.target.value))}><option value={.85}>{text('稍慢','Slower')}</option><option value={1}>{text('正常','Normal')}</option><option value={1.1}>{text('稍快','Faster')}</option></select></label><EnglishAudioButton playback={playback} target={playbackKey(undefined,'preview')} label={text('试听声音','Preview voice')} className="english-preview-audio" size={17} onClick={()=>speak('Could you give me a hand? I am trying to figure this out.','preview')}>{text('试听声音','Preview voice')}</EnglishAudioButton>
      {speechEngine==='browser'&&<small>{voices.some(isNaturalVoice)?text('使用浏览器提供的英语声音。','Uses English voices supplied by your browser.'):text('当前浏览器没有自然英语音色，备用声音可能较机械。','This browser has no natural English voice; backup speech may sound robotic.')}</small>}
    </div>);
  const playbackFeedback=<EnglishPlaybackNotice playback={playback} onRetry={()=>player.current?.retry()} onDismiss={resetPlayback}/>;
  return <div className="english-notebook">
    <section className="english-search-panel" aria-labelledby="english-search-title">
      <div className="english-search-heading"><div><span className="english-kicker"><Sparkles size={15}/>{text('今天遇到了什么？','What did you come across today?')}</span><h2 id="english-search-title">{text('单词、短语、原句，都能记下来。','Save words, phrases or whole sentences.')}</h2></div><a className="secondary" href="/api/english/export"><ArrowDownToLine size={16}/>{text('导出卡片','Export cards')}</a></div>
      <form onSubmit={e=>{e.preventDefault();void lookup();}}>
        <div className="english-entry-row"><div className="english-query"><textarea ref={queryInput} aria-label={text('输入单词、短语或英文原句','Enter words, phrases or English sentences')} maxLength={10000} rows={2} value={query} onChange={e=>editQuery(e.target.value)} onPaste={event=>{const image=clipboardImage(event.clipboardData.items);if(image){event.preventDefault();setOcrImage(image);}}}
          onKeyDown={event=>{
            if(event.key!=='Enter'||event.shiftKey||event.nativeEvent.isComposing||event.keyCode===229||working)return;
            event.preventDefault();
            if(!event.repeat&&!loading&&!working&&query.trim())event.currentTarget.form?.requestSubmit();
          }} placeholder={working?text('可以继续输入下一批单词、短语或原句…','Keep typing the next words, phrases or sentences…'):text('每行一个单词、短语或原句，也可以用分号分隔…','Enter one word, phrase or sentence per line, or use semicolons…')} required/>{query&&<button type="button" className="english-clear" aria-label={text('清空输入','Clear input')} title={text('清空输入','Clear input')} onClick={()=>{editQuery('');setError('');setNotice('');queryInput.current?.focus();}}><X size={18}/></button>}</div><button type="submit" className="dark-button english-generate-button" disabled={loading||working||!query.trim()}>{working?<LoaderCircle className="spin" size={17}/>:<Sparkles size={17}/>} {working?text('正在生成…','Generating…'):text('生成并保存卡片','Generate & save cards')}</button></div>
      </form>
      <EnglishImageInput image={ocrImage} onImage={setOcrImage} onText={value=>{editQuery(appendOcrText(query,value));setOcrImage(null);queryInput.current?.focus();}}/>
      <div className="english-search-foot"><span><strong>{todayCount}</strong> {text('张今日新卡片','new today')}<i/> <strong>{cards.length}</strong> {text('张积累','in your notebook')}</span></div>
    </section>
    {batch.length>0&&<section className="english-batch" aria-label={text('生成进度','Generation progress')}><p role="status">{text('生成进度','Progress')}：{batch.filter(item=>item.status==='done'||item.status==='failed').length}/{batch.length} · {text('已保存／打开','Saved or opened')} {batch.filter(item=>item.status==='done').length}</p><ul>{batch.map(item=><li key={item.query}><strong>{item.query}</strong><span>{({pending:text('等待生成','Queued'),working:text('正在生成…','Generating…'),done:text('已保存／打开','Saved or opened'),failed:text('生成失败','Failed')})[item.status]}</span>{item.error&&<span role="alert">{item.error}</span>}{item.status==='failed'&&<button disabled={working} onClick={()=>void lookup(item.query,item)}>{text('重试此项','Retry this item')}</button>}</li>)}</ul></section>}
    {error&&<div className="error-banner" role="alert"><span>{error}</span>{loading?null:<button onClick={()=>void load()}>{text('刷新卡片库','Reload notebook')}</button>}</div>}
    {notice&&<p className="english-status" role="status"><Check size={16}/>{notice}</p>}
    <div className="english-library-heading"><h2><BookOpen size={20}/>{text('我的英语积累','My English notebook')}</h2><div className="english-library-actions">{(enriching||enrichError)&&<button className="secondary" disabled={enriching} title={enrichError} onClick={()=>void enrichLibrary()}>{enriching?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} {enriching?text(`整理语块 ${enrichProgress.done}/${enrichProgress.total}`,`Preparing chunks ${enrichProgress.done}/${enrichProgress.total}`):text('继续整理语块','Retry chunk preparation')}</button>}<button className="secondary" disabled={!visible.length} onClick={enterReview}><GalleryHorizontalEnd size={17}/>{text('过卡片','Review cards')}</button><button ref={wallEntry} className="secondary" onClick={enterWall}><Maximize2 size={17}/>{text('全屏卡片','Full-screen cards')}</button></div></div>
    {enrichError&&<p className="english-status" role="alert">{enrichError}</p>}
    {!wallOpen&&!reviewOpen&&<>{voiceSettings}{playbackFeedback}</>}
    <div className="english-library">
      <aside className="english-card-list" aria-label={text('已保存的英语卡片','Saved English cards')}>
        <label className="english-filter"><Search size={16}/><input value={filter} onChange={e=>changeFilter(e.target.value)} placeholder={text('搜索已存的卡片','Search saved cards')} aria-label={text('搜索已存的卡片','Search saved cards')}/></label>
        <div className="english-tabs" role="group" aria-label={text('筛选卡片','Filter cards')}>{(['all','word','expression','favorite'] as const).map(id=><button key={id} aria-pressed={tab===id} className={tab===id?'active':''} onClick={()=>changeTab(id)}>{({all:text('全部','All'),word:text('单词','Words'),expression:text('表达','Phrases'),favorite:text('收藏','Starred')})[id]}</button>)}</div>
        <div className="english-card-scroll" ref={cardList}>{loading?<p role="status" className="english-list-empty">{text('正在读取卡片…','Loading cards…')}</p>:visible.length?visible.map(card=><button className={`english-card-item ${active?.id===card.id?'active':''}`} key={card.id} aria-pressed={active?.id===card.id} onClick={()=>{if(playback.part==='reminder')resetPlayback();setSelected(card.id);setSearchSelected(card.id);setNotice('');}}><span><strong lang="en">{displayNumbers.get(card.id)} · {englishTitle(card)}</strong>{card.favorite&&<Star size={14} fill="currentColor"/>}</span><p>{englishMeaning(card)}</p><small>{card.partOfSpeech??(card.kind==='word'?text('词汇语块','Vocabulary chunk'):text('表达语块','Expression chunk'))} · {new Date(card.createdAt).toLocaleDateString(zh?'zh-CN':'en-NZ',{month:'short',day:'numeric'})}</small></button>):<p className="english-list-empty">{cards.length?text('没有符合筛选条件的卡片。','No matching cards.'):text('查过的词和表达会自动出现在这里。','Your words and expressions will appear here.')}</p>}</div>
      </aside>
      {active?<EnglishCardDetail key={active.id} playback={playback} card={active} number={displayNumbers.get(active.id)} editing={editing} working={working} onFavorite={card=>void favorite(card)} onRemove={card=>void remove(card)} onSpeak={readCard} onLookup={term=>void lookup(term,false,false)}/>:<div className="english-welcome"><span className="english-welcome-icon"><BookOpen size={32}/></span><span className="english-kicker">YOUR EVERYDAY WORDS</span><h2>{text('从今天遇到的那个词开始。','Start with a word from your day.')}</h2><p>{text('不必一次学很多。把看过却不会用的表达留在这里，下次遇到，就熟悉一点。','You don’t need a long word list. Save an expression you want to use, and get a little more familiar with it.')}</p><div>{['figure out','I’m down','take your time'].map(term=><button key={term} disabled={working} onClick={()=>void lookup(term,false,false)}>{term}<ArrowUpRight size={14}/></button>)}</div><small>{text('每张卡片：简短意思 · 使用场景 · 例句 · 一个易错点','Each card: meaning · usage · examples · one common pitfall')}</small></div>}
    </div>
    {wallOpen&&!reviewOpen&&<EnglishCardWall cards={cards} visible={visible} numbers={displayNumbers} filter={filter} onFilter={changeFilter} tab={tab} onTab={changeTab} loading={loading} editing={editing} working={working} error={error} onReload={()=>void load()} onExit={exitWall} onReview={enterReview} onResetPlayback={resetPlayback} voiceSettings={voiceSettings} playback={playback} playbackFeedback={playbackFeedback} onFavorite={card=>void favorite(card)} onRemove={card=>void remove(card)} onSpeak={readCard} onLookup={term=>{exitWall();void lookup(term,false,false);}}/>}
    {reviewOpen&&visible.length>0&&<EnglishReview cards={visible} numbers={displayNumbers} initialId={active?.id??''} playback={playback} feedback={playbackFeedback} onSequence={reviewSequence} onStop={resetPlayback} onExit={exitReview}/>}
  </div>;
}
