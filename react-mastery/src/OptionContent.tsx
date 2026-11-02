// Render only code delimiters, never arbitrary HTML from a generated answer.
export default function OptionContent({text}:{text:string}) {
  return <span className="option-content">{text.split(/(```[\s\S]*?```|`[^`\n]+`)/g).map((part,i)=>{
    if(part.startsWith('```')){
      const match=/^```([^\n]*)\n([\s\S]*?)```$/.exec(part);
      return match?<code className="option-code" key={i}>{match[2]}</code>:part;
    }
    return part.startsWith('`')?<code key={i}>{part.slice(1,-1)}</code>:part;
  })}</span>;
}
