import {useState} from 'react';
import type {ReactNode} from 'react';
import {BookOpen,Headphones,Minimize2,Search,SlidersHorizontal,Star,X} from 'lucide-react';
import type {EnglishCard} from '../shared/english.ts';
import {useLanguage} from './language.tsx';
import NotebookDialog from './NotebookDialog.tsx';
import EnglishCardDetail from './EnglishCardDetail.tsx';
import type {EnglishDetailProps} from './EnglishCardDetail.tsx';
import './english-card-wall.css';

type WallProps=Pick<EnglishDetailProps,'editing'|'working'|'onFavorite'|'onRemove'|'onSpeak'|'onLookup'>&{
  cards:EnglishCard[];visible:EnglishCard[];numbers:Map<string,number>;filter:string;onFilter:(value:string)=>void;
  tab:'all'|'word'|'expression'|'favorite';onTab:(value:'all'|'word'|'expression'|'favorite')=>void;
  loading:boolean;error:string;onReload:()=>void;onExit:()=>void;onResetPlayback:()=>void;voiceSettings:ReactNode;playback:ReactNode;
};
export default function EnglishCardWall(props:WallProps){
  const {language}=useLanguage();const text=(cn:string,en:string)=>language==='zh'?cn:en;
  const [detailId,setDetailId]=useState('');
  const detail=props.cards.find(card=>card.id===detailId);
  const closeDetail=()=>{props.onResetPlayback();setDetailId('');};
  return <NotebookDialog className="english-wall" labelledBy="english-wall-title" onDismiss={props.onExit}>
    <div className="english-wall-heading"><div><h2 id="english-wall-title"><BookOpen size={23}/>{text('我的英语积累','My English notebook')}</h2><span>{props.visible.length} / {props.cards.length} {text('张卡片','cards')}</span></div><button className="secondary" onClick={props.onExit}><Minimize2 size={18}/>{text('退出全屏','Exit full screen')}</button></div>
    <div className="english-wall-toolbar">
      <label className="english-filter"><Search size={18}/><input data-dialog-focus value={props.filter} onChange={event=>props.onFilter(event.target.value)} placeholder={text('搜索已存的卡片','Search saved cards')} aria-label={text('搜索已存的卡片','Search saved cards')}/>{props.filter&&<button aria-label={text('清空搜索','Clear search')} onClick={()=>props.onFilter('')}><X size={16}/></button>}</label>
      <div className="english-tabs" role="group" aria-label={text('筛选卡片','Filter cards')}>{(['all','word','expression','favorite'] as const).map(tab=><button key={tab} aria-pressed={props.tab===tab} className={props.tab===tab?'active':''} onClick={()=>props.onTab(tab)}>{({all:text('全部','All'),word:text('单词','Words'),expression:text('表达','Phrases'),favorite:text('收藏','Starred')})[tab]}</button>)}</div>
      <details className="english-wall-voices"><summary><SlidersHorizontal size={17}/>{text('声音设置','Voice settings')}</summary>{props.voiceSettings}</details>
    </div>
    <div className="english-wall-feedback">
      {props.error&&<div className="error-banner" role="alert"><span>{props.error}</span><button onClick={props.onReload}>{text('刷新卡片库','Reload notebook')}</button></div>}
      {!detail&&props.playback}
    </div>
    <div className="english-wall-grid" aria-label={text('平铺英语卡片','English card grid')}>
      {props.loading?<p role="status" className="english-wall-empty">{text('正在读取卡片…','Loading cards…')}</p>:props.visible.length?props.visible.map(card=><article className="english-tile" key={card.id}>
        <button className="english-tile-open" aria-label={text(`查看 ${card.term} 详情`,`View ${card.term} details`)} onClick={()=>{props.onResetPlayback();setDetailId(card.id);}}><h3 lang="en" title={card.term}><span className="english-tile-number">{props.numbers.get(card.id)} · </span>{card.term}</h3><p className="english-tile-meaning">{card.meaning}</p></button>
        <div className="english-tile-actions"><small className="english-tile-meta">{card.kind==='word'?text('单词','Word'):text('表达','Phrase')} · {new Date(card.createdAt).toLocaleDateString(language==='zh'?'zh-CN':'en-NZ',{month:'short',day:'numeric'})}</small><div><button onClick={()=>props.onSpeak(card,'term')} aria-label={text(`朗读 ${card.term}`,`Read ${card.term} aloud`)} title={text('朗读','Listen')}><Headphones size={16}/></button><button disabled={props.editing} aria-pressed={card.favorite} aria-label={card.favorite?text(`取消收藏 ${card.term}`,`Unstar ${card.term}`):text(`收藏 ${card.term}`,`Star ${card.term}`)} title={card.favorite?text('取消收藏','Unstar'):text('收藏','Star')} onClick={()=>props.onFavorite(card)}><Star size={16} fill={card.favorite?'currentColor':'none'}/></button></div></div>
      </article>):<div className="english-wall-empty"><BookOpen size={34}/><p>{props.cards.length?text('没有符合筛选条件的卡片。','No matching cards.'):text('生成卡片后，就可以在这里平铺浏览。','Add some cards to browse them here.')}</p>{(props.filter||props.tab!=='all')&&<button className="secondary" onClick={()=>{props.onFilter('');props.onTab('all');}}>{text('清除筛选','Clear filters')}</button>}</div>}
    </div>
    {detail&&<NotebookDialog className="english-wall-detail" labelledBy="english-wall-detail-title" onDismiss={closeDetail}><div className="english-wall-detail-bar"><button className="secondary" data-dialog-focus onClick={closeDetail}><X size={18}/>{text('返回卡片墙','Back to cards')}</button></div><div className="english-wall-detail-content">{props.error&&<p role="alert">{props.error}</p>}{props.playback}<EnglishCardDetail card={detail} number={props.numbers.get(detail.id)} headingId="english-wall-detail-title" editing={props.editing} working={props.working} onFavorite={props.onFavorite} onRemove={props.onRemove} onSpeak={props.onSpeak} onLookup={props.onLookup}/></div></NotebookDialog>}
  </NotebookDialog>;
}
