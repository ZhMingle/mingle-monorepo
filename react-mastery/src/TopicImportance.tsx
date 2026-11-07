import {useEffect,useState} from 'react';
import {Star} from 'lucide-react';
import {request} from './api.ts';
import {useLanguage} from './language.tsx';
import {authoredImportance} from '../shared/topic-importance.ts';
import type {TopicImportance as Importance} from '../shared/topic-importance.ts';
import './topic-importance.css';
const cache=new Map<string,Importance>();
export default function TopicImportance({topicId}:{topicId:string}){
  const {language}=useLanguage();const zh=language==='zh';const key=`${topicId}:${language}`;
  const authored=authoredImportance(topicId,language);
  const [result,setResult]=useState<{key:string;value:Importance}|null>(null);
  const [error,setError]=useState('');const [retry,setRetry]=useState(0);
  const value=authored??cache.get(key)??(result?.key===key?result.value:null);
  useEffect(()=>{
    setError('');if(authored||cache.has(key))return;
    let live=true;
    void request<Importance>('topic-importance',{topicId,language}).then(value=>{cache.set(key,value);if(live)setResult({key,value});}).catch(e=>{if(live)setError((e as Error).message);});
    return()=>{live=false;};
  },[key,retry]);
  return <section className="topic-importance" aria-label={zh?'知识点重要性':'Topic importance'}>
    {!value?<p role={error?'alert':'status'}>{error?<>{zh?'重要性说明暂时没加载成功。':'Could not load importance.'}<button onClick={()=>setRetry(n=>n+1)}>{zh?'重试':'Retry'}</button></>:zh?'正在整理重要性和实际用途…':'Preparing importance and practical uses…'}</p>:<>
      <div className="importance-heading"><strong>{zh?'重要性':'Importance'}</strong><span className="importance-stars" role="img" aria-label={zh?`重要性 ${value.stars} 星，满分 5 星`:`Importance ${value.stars} out of 5 stars`}>{[1,2,3,4,5].map(n=><Star key={n} size={18} fill={n<=value.stars?'currentColor':'none'} className={n<=value.stars?'filled':''}/>)}</span><strong>{value.stars}/5</strong><span>{zh?['','了解即可','按需学习','实用知识','重点掌握','核心必学'][value.stars]:['','Optional','Specialized','Useful','High priority','Essential'][value.stars]}</span></div>
      <div className="importance-body"><div><h3>{zh?'为什么重要':'Why it matters'}</h3><p>{value.why}</p></div><div><h3>{zh?'实际用来做什么':'Where you use it'}</h3><ul>{value.uses.map(use=><li key={use}>{use}</li>)}</ul></div></div>
      <small>{zh?'按日常使用频率和基础作用评定，星级不代表难度。':'Based on everyday usefulness and foundational value, not difficulty.'}</small>
    </>}
  </section>;
}
