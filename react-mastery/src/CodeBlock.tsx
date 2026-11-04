import {useEffect,useRef} from 'react';
import {EditorState} from '@codemirror/state';
import {Decoration,EditorView,gutter,GutterMarker} from '@codemirror/view';
import type {DiffKind} from '../shared/code-diff.ts';
import {oneDark} from '@codemirror/theme-one-dark';
import {languageExtension} from './CodeEditor.tsx';
import {codeFlavor} from './code-format.ts';
import {displayCode} from '../shared/rich-text.ts';
import './code-block.css';

// Read-only syntax rendering: no formatting, learner callbacks, or execution.
export default function CodeBlock({code,language,pathId,label,diffKinds}:{code:string;language:string;pathId?:string;label:string;diffKinds?:DiffKind[]}){
  const host=useRef<HTMLDivElement>(null);
  const display=displayCode(code);
  const source=display.code;
  const flavor=codeFlavor(display.language||language,pathId);
  useEffect(()=>{
    class Mark extends GutterMarker {
      constructor(readonly kind:DiffKind){super();}
      toDOM(){const node=document.createElement('span');node.textContent=this.kind==='add'?'+':this.kind==='remove'?'−':' ';node.setAttribute('aria-hidden','true');return node;}
    }
    const doc=EditorState.create({doc:source}).doc;
    const diff=diffKinds?[EditorView.decorations.of(Decoration.set(diffKinds.flatMap((kind,i)=>kind==='context'||i>=doc.lines?[]:[Decoration.line({class:`code-diff-${kind}`}).range(doc.line(i+1).from)]))),gutter({class:'code-diff-gutter',lineMarker:(_view,line)=>new Mark(diffKinds[doc.lineAt(line.from).number-1]??'context')})]:[];
    const view=new EditorView({parent:host.current!,state:EditorState.create({doc:source,extensions:[
      oneDark,languageExtension(flavor),...diff,EditorState.readOnly.of(true),EditorView.editable.of(false),
      EditorView.contentAttributes.of({'aria-label':label,'aria-readonly':'true',role:'textbox',tabindex:'0',spellcheck:'false'}),
      EditorView.theme({'&':{backgroundColor:'#252e27'},'.cm-content':{padding:'18px 0'},'.cm-line':{padding:'0 22px'},'.cm-scroller':{fontFamily:'Consolas, monospace',fontSize:'calc(14px + var(--small-text-increase, 0px))',lineHeight:'1.75',overflow:'auto'}})
    ]})});
    return()=>view.destroy();
  },[source,flavor,label,diffKinds]);
  return <div ref={host} className="reference-code-block"/>;
}
