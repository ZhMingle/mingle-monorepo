import {useEffect,useRef} from 'react';
import {EditorState} from '@codemirror/state';
import {Decoration,EditorView,gutter,GutterMarker} from '@codemirror/view';
import type {DiffKind,ChangedRange} from '../shared/code-diff.ts';
import {oneDark} from '@codemirror/theme-one-dark';
import {languageExtension} from './CodeEditor.tsx';
import {codeFlavor} from './code-format.ts';
import {displayCode,displayCodeSections} from '../shared/rich-text.ts';
import './code-block.css';

// Read-only syntax rendering: no formatting, learner callbacks, or execution.
type CodeBlockProps={code:string;language:string;pathId?:string;label:string;diffKinds?:DiffKind[];diffRanges?:ChangedRange[][];lineLabels?:string[]};
export default function CodeBlock(props:CodeBlockProps){
  const sections=props.diffKinds?[{code:props.code,language:props.language}]:displayCodeSections(props.code);
  return <>{sections.map((section,i)=><SourceCodeBlock key={i} {...props} code={section.code} language={section.language||props.language}/>)}</>;
}
function SourceCodeBlock({code,language,pathId,label,diffKinds,diffRanges,lineLabels}:CodeBlockProps){
  const host=useRef<HTMLDivElement>(null);
  const display=displayCode(code);
  const source=display.code;
  const flavor=codeFlavor(display.language||language,pathId);
  useEffect(()=>{
    class Mark extends GutterMarker {
      constructor(readonly kind:DiffKind,readonly label=''){super();}
      toDOM(){const node=document.createElement('span');node.textContent=`${this.label} ${this.kind==='add'?'+':this.kind==='remove'?'−':' '}`;return node;}
    }
    const doc=EditorState.create({doc:source}).doc;
    const diff=diffKinds?[EditorView.decorations.of(Decoration.set(diffKinds.flatMap((kind,i)=>{
      if(kind==='context'||i>=doc.lines)return [];
      const line=doc.line(i+1);
      return [Decoration.line({class:`code-diff-${kind}`}).range(line.from),...(diffRanges?.[i]??[]).filter(r=>r.to>r.from&&r.to<=line.length).map(r=>Decoration.mark({class:`code-diff-char-${kind}`}).range(line.from+r.from,line.from+r.to))];
    }),true)),gutter({class:'code-diff-gutter',lineMarker:(_view,line)=>{const i=doc.lineAt(line.from).number-1;return new Mark(diffKinds[i]??'context',lineLabels?.[i]);}})]:[];
    const view=new EditorView({parent:host.current!,state:EditorState.create({doc:source,extensions:[
      oneDark,languageExtension(flavor),...diff,EditorState.readOnly.of(true),EditorView.editable.of(false),
      EditorView.contentAttributes.of({'aria-label':label,'aria-readonly':'true',role:'textbox',tabindex:'0',spellcheck:'false'}),
      EditorView.theme({'&':{backgroundColor:'#252e27'},'.cm-content':{padding:'18px 0'},'.cm-line':{padding:'0 22px'},'.cm-scroller':{fontFamily:'Consolas, monospace',fontSize:'calc(14px + var(--small-text-increase, 0px))',lineHeight:'1.75',overflow:'auto'}})
    ]})});
    return()=>view.destroy();
  },[source,flavor,label,diffKinds,diffRanges,lineLabels]);
  return <div ref={host} className="reference-code-block"/>;
}
