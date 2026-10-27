import {useEffect,useRef,useState} from 'react';
import {basicSetup} from 'codemirror';
import {EditorView,keymap} from '@codemirror/view';
import {Compartment,EditorState,Transaction} from '@codemirror/state';
import {indentUnit,indentRange,StreamLanguage} from '@codemirror/language';
import {indentWithTab,undo,undoDepth,isolateHistory} from '@codemirror/commands';
import {javascript} from '@codemirror/lang-javascript';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {sql,MySQL,PostgreSQL,MSSQL} from '@codemirror/lang-sql';
import {csharp} from '@codemirror/legacy-modes/mode/clike';
import {oneDark} from '@codemirror/theme-one-dark';
import {codeFlavor,formatSource} from './code-format.ts';
import type {CodeFlavor} from './code-format.ts';
import {useLanguage} from './language.tsx';
import './code-editor.css';

function languageExtension(flavor:CodeFlavor){
  switch(flavor){
    case 'jsx':return javascript({jsx:true});case 'javascript':return javascript();
    case 'typescript':return javascript({typescript:true});case 'tsx':return javascript({typescript:true,jsx:true});
    case 'html':return html();case 'css':return css();
    case 'mysql':return sql({dialect:MySQL});case 'postgresql':return sql({dialect:PostgreSQL});case 'tsql':return sql({dialect:MSSQL});
    case 'csharp':return StreamLanguage.define(csharp);default:return [];
  }
}
interface Props {value:string;starter:string;language:string;pathId?:string;disabled?:boolean;maxLength?:number;label:string;onChange:(code:string)=>void}
export default function CodeEditor(props:Props){
  const {language:uiLanguage}=useLanguage();const say=(en:string,zh:string)=>uiLanguage==='zh'?zh:en;
  const host=useRef<HTMLDivElement|null>(null);const editor=useRef<EditorView|null>(null);
  const latest=useRef(props);latest.current=props;
  const configuration=useRef(new Compartment());const mode=useRef(new Compartment());const accessible=useRef(new Compartment());
  const revision=useRef(0);const generation=useRef(0);const formattingNow=useRef(false);
  const [formatting,setFormatting]=useState(false);const [canUndo,setCanUndo]=useState(false);
  const [message,setMessage]=useState('');const [failed,setFailed]=useState(false);
  const [autoFormat,setAutoFormat]=useState(()=>{try{return localStorage.getItem('clarity.editor.autoFormat')!=='false';}catch{return true;}});
  const auto=useRef(autoFormat);auto.current=autoFormat;
  const formatter=useRef<()=>void>(()=>{});formatter.current=()=>void formatDocument();
  const flavor=codeFlavor(props.language,props.pathId);
  async function formatDocument(){
    const view=editor.current;if(!view||latest.current.disabled||formattingNow.current)return;
    const kind=codeFlavor(latest.current.language,latest.current.pathId);if(kind==='text')return;
    setMessage('');setFailed(false);
    if(kind==='csharp'){
      view.dispatch({changes:indentRange(view.state,0,view.state.doc.length),annotations:[Transaction.userEvent.of('input.format'),isolateHistory.of('full')]});
      setMessage(say('Indentation updated.','缩进已整理。'));return;
    }
    const code=view.state.doc.toString();const version=revision.current;const token=++generation.current;
    formattingNow.current=true;setFormatting(true);
    try{
      const formatted=await formatSource(code,kind);
      // Async parser loading must never overwrite newer typing, resets, another
      // exercise, or code currently being submitted.
      if(editor.current!==view||token!==generation.current||revision.current!==version||latest.current.disabled)return;
      if(formatted.length>(latest.current.maxLength??12000))throw Error(say('Formatted code exceeds the size limit.','格式化后的代码超出长度限制。'));
      if(formatted!==code)view.dispatch({changes:{from:0,to:view.state.doc.length,insert:formatted},selection:{anchor:Math.min(view.state.selection.main.head,formatted.length)},annotations:Transaction.userEvent.of('input.format')});
      setMessage(say('Formatted. Ctrl+Z to undo.','已格式化，可用 Ctrl+Z 撤销。'));
    }catch(e){
      if(editor.current===view&&token===generation.current&&revision.current===version&&!latest.current.disabled){setFailed(true);setMessage(`${say('Formatting could not finish; your code is unchanged.','格式化未完成，原代码已保留。')} ${(e as Error).message}`);}
    }finally{
      formattingNow.current=false;if(editor.current===view)setFormatting(false);
    }
  }
  function reset(){
    const view=editor.current;if(!view||latest.current.disabled)return;
    generation.current++;
    view.dispatch({changes:{from:0,to:view.state.doc.length,insert:latest.current.starter},selection:{anchor:0},annotations:[Transaction.userEvent.of('input.reset'),isolateHistory.of('full')]});
    view.focus();setFailed(false);setMessage(say('Initial code restored. Ctrl+Z to undo.','已恢复初始代码，可用 Ctrl+Z 撤销。'));
  }
  useEffect(()=>{
    const view=new EditorView({parent:host.current!,doc:latest.current.value,extensions:[basicSetup,oneDark,EditorView.lineWrapping,indentUnit.of('  '),
      mode.current.of(languageExtension(codeFlavor(latest.current.language,latest.current.pathId))),
      configuration.current.of([EditorState.readOnly.of(!!latest.current.disabled),EditorView.editable.of(!latest.current.disabled)]),
      accessible.current.of(EditorView.contentAttributes.of({'aria-label':latest.current.label,spellcheck:'false',autocapitalize:'off',autocorrect:'off'})),
      keymap.of([{key:'Shift-Alt-f',run:()=>{formatter.current();return true;}},indentWithTab]),
      EditorState.changeFilter.of(tr=>!tr.docChanged||tr.newDoc.length<=(latest.current.maxLength??12000)),
      EditorView.updateListener.of(update=>{if(update.docChanged){revision.current++;latest.current.onChange(update.state.doc.toString());}setCanUndo(undoDepth(update.state)>0);}),
      EditorView.domEventHandlers({blur:(event)=>{
        if(auto.current&&!latest.current.disabled&&!host.current?.parentElement?.contains(event.relatedTarget as Node|null))formatter.current();
        return false;
      }})
    ]});editor.current=view;
    return()=>{generation.current++;editor.current=null;view.destroy();};
  },[]);
  useEffect(()=>{const view=editor.current;if(view&&view.state.doc.toString()!==props.value)view.dispatch({changes:{from:0,to:view.state.doc.length,insert:props.value}});},[props.value]);
  useEffect(()=>{generation.current++;editor.current?.dispatch({effects:mode.current.reconfigure(languageExtension(flavor))});},[flavor]);
  useEffect(()=>{editor.current?.dispatch({effects:configuration.current.reconfigure([EditorState.readOnly.of(!!props.disabled),EditorView.editable.of(!props.disabled)])});},[props.disabled]);
  useEffect(()=>{editor.current?.dispatch({effects:accessible.current.reconfigure(EditorView.contentAttributes.of({'aria-label':props.label,spellcheck:'false',autocapitalize:'off',autocorrect:'off'}))});},[props.label]);
  return <div className="code-editor">
    <div className="code-editor-toolbar"><strong>{props.language}</strong><div>
      <label><input type="checkbox" checked={autoFormat} disabled={!!props.disabled||flavor==='text'} onChange={e=>{setAutoFormat(e.target.checked);try{localStorage.setItem('clarity.editor.autoFormat',String(e.target.checked));}catch{/* Preference still works in this session. */}}}/>{say('Format on blur','离开时自动格式化')}</label>
      <button type="button" disabled={!!props.disabled||formatting||flavor==='text'} onClick={()=>void formatDocument()}>{formatting?say('Formatting…','格式化中…'):flavor==='csharp'?say('Reindent','整理缩进'):say('Format','格式化')}</button>
      <button type="button" disabled={!!props.disabled||props.value===props.starter} onClick={reset}>{say('Restore initial code','恢复初始代码')}</button>
      <button type="button" disabled={!!props.disabled||!canUndo} onClick={()=>{if(editor.current){generation.current++;undo(editor.current);editor.current.focus();setMessage('');}}}>{say('Undo','撤销')}</button>
    </div></div>
    <div ref={host}/>
    <div className="code-editor-hint">{say('Tab: indent · Shift+Alt+F: format · Ctrl+Z: undo','Tab 缩进 · Shift+Alt+F 格式化 · Ctrl+Z 撤销')}{flavor==='csharp'&&` · ${say('C#: indentation only','C#：仅整理缩进')}`}</div>
    {message&&<p className={`code-editor-message ${failed?'format-error':''}`} role={failed?'alert':'status'}>{message}</p>}
  </div>;
}
