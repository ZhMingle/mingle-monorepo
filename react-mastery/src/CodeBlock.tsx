import {useEffect,useRef} from 'react';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {oneDark} from '@codemirror/theme-one-dark';
import {languageExtension} from './CodeEditor.tsx';
import {codeFlavor} from './code-format.ts';
import './code-block.css';

// Read-only syntax rendering: no formatting, learner callbacks, or execution.
export default function CodeBlock({code,language,pathId,label}:{code:string;language:string;pathId?:string;label:string}){
  const host=useRef<HTMLDivElement>(null);
  const flavor=codeFlavor(language,pathId);
  useEffect(()=>{
    const view=new EditorView({parent:host.current!,state:EditorState.create({doc:code,extensions:[
      oneDark,languageExtension(flavor),EditorState.readOnly.of(true),EditorView.editable.of(false),
      EditorView.contentAttributes.of({'aria-label':label,'aria-readonly':'true',role:'textbox',tabindex:'0',spellcheck:'false'}),
      EditorView.theme({'&':{backgroundColor:'#252e27'},'.cm-content':{padding:'18px 0'},'.cm-line':{padding:'0 22px'},'.cm-scroller':{fontFamily:'Consolas, monospace',fontSize:'14px',lineHeight:'1.75',overflow:'auto'}})
    ]})});
    return()=>view.destroy();
  },[code,flavor,label]);
  return <div ref={host} className="reference-code-block"/>;
}
