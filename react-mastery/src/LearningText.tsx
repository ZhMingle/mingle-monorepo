import CodeBlock from './CodeBlock.tsx';
import { inlineParts,textBlocks } from '../shared/rich-text.ts';
import './learning-text.css';

function Inline({text}:{text:string}){
  return <>{inlineParts(text).map((part,i)=>part.kind==='code'?<code key={i}>{part.text}</code>:part.kind==='strong'?<strong key={i}><Inline text={part.text}/></strong>:part.text)}</>;
}
// Deliberately supports only teaching text, with no HTML injection or active links.
export default function LearningText({text,language='',pathId=''}:{text:string;language?:string;pathId?:string}){
  return <div className="learning-text">{textBlocks(text).map((block,i)=>{
    if(block.kind==='code')return <CodeBlock key={i} code={block.text} language={block.language||language} pathId={pathId} label="Code"/>;
    if(block.kind==='heading')return <h4 key={i}><Inline text={block.text}/></h4>;
    if(block.kind==='list'){const List=block.ordered?'ol':'ul';return <List key={i}>{block.items.map((item,j)=><li key={j}><Inline text={item}/></li>)}</List>;}
    return <p key={i}><Inline text={block.text}/></p>;
  })}</div>;
}
