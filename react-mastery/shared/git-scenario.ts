import {displayCode} from './rich-text.ts';
export interface GitScenarioData {
  initial:{scenario:string}[];
  introduction:{scenario:string}[];
  steps:({scenario:string;code?:never}|{code:string;scenario?:never})[];
}
// This changes presentation only: no Git execution or inferred repository state.
export function readableGitScenario(source:string):GitScenarioData|null {
  const code=displayCode(source).code;
  if(/<<[-~]?\s*['"]?\w|```/.test(code))return null;
  const result:GitScenarioData={initial:[],introduction:[],steps:[]};let actions=false;
  for(const raw of code.replace(/\r\n/g,'\n').split('\n')){
    if(!raw.trim())continue;
    const comment=/^\s*#\s?(.*)$/.exec(raw);
    if(comment){
      const text=comment[1];
      if(/^(?:以下|接下来|操作步骤|依次执行|Steps\b|Operations?\b|The following\b)/i.test(text)){
        result.introduction.push({scenario:text});actions=true;continue;
      }
      const numbered=/^(?:(?:Step|步骤)\s*)?\d+[.、):：]\s*(.*)$/i.exec(text);
      if(numbered)actions=true;
      if(actions)result.steps.push({scenario:numbered?numbered[1]:text});
      else result.initial.push({scenario:text});
    }else{
      actions=true;
      const previous=result.steps.at(-1);
      if(previous?.code!==undefined)previous.code+='\n'+raw;
      else result.steps.push({code:raw});
    }
  }
  return result.steps.length?result:null;
}
