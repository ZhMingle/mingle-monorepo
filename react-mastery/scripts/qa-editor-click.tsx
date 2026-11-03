import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import CodeEditor from '../src/CodeEditor.tsx';
import {LanguageProvider} from '../src/language.tsx';

const starter='function Example(){const items=[1,2,3];return <ul>{items.map(item=><li key={item}>{item}</li>)}</ul>}';
function Check(){
  const [code,setCode]=useState(starter);const [runs,setRuns]=useState(0);
  return <main><h1>Editor click regression</h1><p>Synthetic code only. No learner records or AI requests.</p>
    <CodeEditor value={code} starter={starter} language="JSX" label="Test code" onChange={setCode}/>
    <button type="button" onClick={()=>setRuns(value=>value+1)}>Run checks</button>
    <p role="status">Runs: {runs}</p>
    <div style={{height:120,padding:20,background:'#eef2e7'}}>Non-interactive blur target</div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<LanguageProvider><Check/></LanguageProvider>);
