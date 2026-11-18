import { useEffect, useState } from 'react';
import catalog from './catalog.json';

type Language = 'en' | 'zh';
type Copy = { en: string; zh: string };
type Topic = { id: string; title: Copy; goal: Copy; check: Copy; source: string };
type Lesson = typeof catalog.lessons[number];
const totalTopics = catalog.paths.reduce((n, p) => n + p.stages.reduce((s, stage) => s + stage.topics.length, 0), 0);
const stages = { foundation: { en: 'Foundations', zh: '基础' }, practice: { en: 'Practice', zh: '实践' }, advanced: { en: 'Next steps', zh: '进阶' } };
const saved = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

export default function App() {
  const [language, setLanguage] = useState<Language>(() => (saved('clarity.language') || saved('clarity.demo.language') || navigator.language).startsWith('zh') ? 'zh' : 'en');
  const [pathId, setPathId] = useState(() => location.hash.startsWith('#roadmap/') ? location.hash.split('/')[1] : '');
  const [route, setRoute] = useState(() => location.hash);
  const [query, setQuery] = useState('');
  const [lessonId, setLessonId] = useState('snapshot');
  const [choice, setChoice] = useState(-1);
  const [checked, setChecked] = useState(false);
  const [read, setRead] = useState<string[]>(() => { try { const value = JSON.parse(saved('clarity.demo.read') || '[]'); return Array.isArray(value) ? value.filter(x => typeof x === 'string') : []; } catch { return []; } });
  const [promptTopic, setPromptTopic] = useState<Topic | null>(null);
  const [question, setQuestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const say = (en: string, zh: string) => language === 'zh' ? zh : en;
  const text = (copy: Copy) => copy[language];
  const path = catalog.paths.find(p => p.id === pathId);
  const readingRoom = route === '#reading-room';
  const lesson = catalog.lessons.find(l => l.id === lessonId) as Lesson;
  const search = query.trim().toLocaleLowerCase();
  const matches = (topic: Topic) => !search || `${topic.title.en} ${topic.title.zh} ${topic.goal.en} ${topic.goal.zh}`.toLocaleLowerCase().includes(search);
  const visiblePaths = catalog.paths.filter(p => !search || `${p.name.en} ${p.name.zh}`.toLocaleLowerCase().includes(search) || p.stages.some(s => s.topics.some(matches)));
  const filteredStages = path?.stages.map(s => ({ ...s, topics: s.topics.filter(topic => !search || `${path.name.en} ${path.name.zh}`.toLocaleLowerCase().includes(search) || matches(topic)) }));
  const prompt = promptTopic ? [
    say('Help me learn this developer topic. Teach one idea at a time using plain English.', '请用自然、易懂的中文教我这个开发知识点，一次讲清一个概念。'),
    `${say('Topic', '知识点')}: ${text(promptTopic.title)}`,
    `${say('Learning goal', '学习目标')}: ${text(promptTopic.goal)}`,
    `${say('Check my understanding', '理解检查')}: ${text(promptTopic.check)}`,
    `${say('Official reference', '官方资料')}: ${promptTopic.source}`,
    say('Start with a concrete example, explain how it works, then ask me one practice question. Wait for my answer before showing a solution. Be clear about anything that has not been executed or verified.', '先给一个具体例子，再解释原理，然后出一道练习题。等我回答后再讲答案。没有实际运行或验证的内容，请明确说明。'),
    question.trim() ? `${say('My question', '我的问题')}: ${question.trim()}` : '',
  ].filter(Boolean).join('\n\n') : '';

  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; try { localStorage.setItem('clarity.language', language); } catch { /* Keep the page usable without storage. */ } }, [language]);
  useEffect(() => { try { localStorage.setItem('clarity.demo.read', JSON.stringify(read)); } catch { /* Read markers stay in memory. */ } }, [read]);
  useEffect(() => {
    const route = () => { const value = location.hash.split('/')[1]; setRoute(location.hash); setPathId(location.hash.startsWith('#roadmap/') && catalog.paths.some(p => p.id === value) ? value : ''); setQuery(''); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', route); return () => window.removeEventListener('hashchange', route);
  }, []);
  useEffect(() => {
    if (!promptTopic) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setPromptTopic(null); };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [promptTopic]);
  function openPrompt(topic: Topic) { setPromptTopic(topic); setQuestion(''); setCopied(false); setCopyError(false); }
  function openLesson(id: string) { setLessonId(id); setChoice(-1); setChecked(false); }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  function pathTopic(id: string): Topic | undefined { return catalog.paths.find(p => p.id === 'react')!.stages.flatMap(s => s.topics).find(t => t.id === `react.${id}`); }

  return <div className="demo-shell">
    <header className="demo-header"><a href="#roadmap" className="demo-brand"><span className="brand-mark" aria-hidden="true">◈</span><span>Clarity<small>Developer Learning Lab</small></span></a><nav aria-label={say('Main navigation', '主导航')}><a href="#roadmap">{say('Learning paths', '学习路线')}</a><a href="#reading-room">{say('React lessons', 'React 课程')}</a><button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>{language === 'en' ? '中文' : 'English'}</button></nav></header>
    <main>
      {!readingRoom && <section className="demo-section" id="curriculum">
        <div className="section-title"><div><span className="eyebrow">CLARITY</span><h1>{path ? text(path.name) : say('Learning paths', '学习路线')}</h1><p>{path ? text(path.description) : say('Choose a skill and explore every stage, topic and official reference.', '选择一项技能，查看各个阶段、全部知识点和官方资料。')}</p></div><span className="read-count">{catalog.paths.length} {say('paths', '条路线')} · {totalTopics} {say('topics', '个知识点')}</span></div>
        <p className="demo-notice">{say('Open a route and start exploring. No sign-in required. Your reading markers belong to this browser.', '打开路线即可浏览，无需登录。阅读标记只保存在你自己的浏览器中。')}</p>
        <label className="search-label" htmlFor="topic-search">{say('Search learning paths and topics', '搜索学习路线和知识点')}</label><input id="topic-search" className="topic-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={say('React, SQL, Azure…', 'React、SQL、Azure…')}/>
        {!path ? <><div className="path-catalog">{visiblePaths.map(p => <a className="path-card" key={p.id} href={`#roadmap/${p.id}`}><span className="path-mark">{p.mark}</span><h2>{text(p.name)}</h2><p>{text(p.description)}</p><span>{p.stages.reduce((sum, s) => sum + s.topics.length, 0)} {say('topics', '个知识点')} · {say('View path →', '查看路线 →')}</span></a>)}</div>{visiblePaths.length === 0 && <p role="status">{say('No matching paths. Try another search.', '没有匹配路线，请换个关键词。')}</p>}</> : <>
          <div className="path-actions"><a href="#roadmap">← {say('All learning paths', '全部学习路线')}</a><a href={path.source} target="_blank" rel="noreferrer">{say('Official reference ↗', '官方资料 ↗')}</a></div>
          <p className="prerequisite">{say('Before you start: ', '学习前提：')}{text(path.prerequisite)}</p>
          <div className="demo-grid">{filteredStages?.filter(stage => stage.topics.length > 0).map(stage => <article className="demo-card" key={stage.id}><span className="eyebrow">{text(stages[stage.id as keyof typeof stages])}</span><h2>{text(stage.project)}</h2>{stage.topics.map(topic => <div className="demo-topic" key={topic.id}><h3>{text(topic.title)}</h3><p>{text(topic.goal)}</p><details><summary>{say('Check your understanding', '检查理解')}</summary><p>{text(topic.check)}</p></details><div className="topic-links"><a href={topic.source} target="_blank" rel="noreferrer">{say('Official reference ↗', '官方资料 ↗')}</a><button className="text-button" onClick={() => openPrompt(topic)}>{say('Learn in ChatGPT ↗', '在 ChatGPT 中学习 ↗')}</button></div><div className="topic-bottom">{path.id === 'react' && catalog.lessons.some(l => `react.${l.id}` === topic.id) && <a href="#reading-room" onClick={() => openLesson(topic.id.split('.')[1])}>{say('Read the lesson →', '阅读讲解 →')}</a>}<button className="read-button" aria-pressed={read.includes(topic.id)} onClick={() => setRead(current => current.includes(topic.id) ? current.filter(id => id !== topic.id) : [...current, topic.id])}>{read.includes(topic.id) ? say('✓ Read', '✓ 已读') : say('Mark as read', '标记已读')}</button></div></div>)}</article>)}</div>
          {filteredStages?.every(stage => stage.topics.length === 0) && <p role="status">{say('No matching topics in this path.', '当前路线中没有匹配知识点。')}</p>}
        </>}
      </section>}
      {readingRoom && <section className="demo-section" id="reading-room"><span className="eyebrow">{say('REACT LESSONS', 'React 课程')}</span><h2>{say('Read. Predict. Understand.', '读懂原理，再预测结果。')}</h2><p className="section-description">{say('Six authored React lessons are ready to read. These checks use the course answer key; they are not AI assessments.', '六节 React 基础讲解可直接阅读。练习按课程答案检查，不属于 AI 评估。')}</p><nav className="demo-paths" aria-label={say('React lessons', 'React 课程')}>{catalog.lessons.map(l => <button key={l.id} aria-pressed={l.id === lesson.id} onClick={() => openLesson(l.id)}>{text(l.title)}</button>)}</nav><div className="demo-grid demo-lab-grid"><article className="demo-card lesson-article"><span className="eyebrow">{say('THE IDEA', '理解概念')}</span><h3>{text(lesson.title)}</h3><p>{text(lesson.summary)}</p>{lesson.paragraphs.map(p => <section key={p.title.en}><h4>{text(p.title)}</h4><p>{text(p.body)}</p></section>)}<pre>{lesson.example}</pre><blockquote>{text(lesson.takeaway)}</blockquote><a href={lesson.source} target="_blank" rel="noreferrer">{say('Read the React documentation ↗', '阅读 React 官方文档 ↗')}</a></article><article className="demo-card prediction-card"><span className="eyebrow">{say('CHECK YOUR UNDERSTANDING', '检查理解')}</span><h3>{text(lesson.prediction.prompt)}</h3><pre>{lesson.prediction.code}</pre><fieldset><legend>{say('Choose one answer', '选择一个答案')}</legend>{lesson.prediction.choices.map((item, i) => <label className="demo-choice" key={i}><input type="radio" name="prediction" checked={choice === i} onChange={() => { setChoice(i); setChecked(false); }}/>{text(item)}</label>)}</fieldset><button className="primary" disabled={choice < 0} onClick={() => setChecked(true)}>{say('Check my answer', '检查答案')}</button>{checked && <div className="answer-feedback" role="status"><strong>{choice === lesson.prediction.answer ? say('That’s right.', '答对了。') : say('Let’s look at why.', '一起看看原因。')}</strong><p>{text(lesson.prediction.explanation)}</p></div>}<div className="chatgpt-card"><h4>{say('Have a follow-up question?', '还有想问的？')}</h4><p>{say('Take this topic into your own ChatGPT and keep learning at your pace.', '把这个知识点带到你自己的 ChatGPT 中，按你的节奏继续学。')}</p><button className="secondary" onClick={() => openPrompt(pathTopic(lesson.id) || { id: `react.${lesson.id}`, title: lesson.title, goal: lesson.summary, check: lesson.takeaway, source: lesson.source })}>{say('Continue in my ChatGPT ↗', '在我的 ChatGPT 继续 ↗')}</button></div></article></div></section>}
    </main><footer>Clarity · Developer Learning Lab<a href="/signin-with-chatgpt?return_to=%2F%3Fworkspace%3D1" target="_top">{say('My learning space', '我的学习空间')}</a><span>{say('Built by Mingle Zhang', 'Mingle Zhang 的个人项目')}</span></footer>
    {promptTopic && <div className="modal-backdrop" onClick={() => setPromptTopic(null)}><section className="prompt-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-title" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label={say('Close', '关闭')} onClick={() => setPromptTopic(null)}>×</button><span className="eyebrow">{say('YOUR TOPIC, YOUR CHATGPT', '你的问题，你的 ChatGPT')}</span><h2 id="prompt-title">{say('Continue learning in ChatGPT', '在 ChatGPT 中继续学习')}</h2><p>{say('Copy this study prompt, open your own ChatGPT, and paste it into a new conversation. Responses stay in your ChatGPT conversation.', '复制这份学习提示，打开你自己的 ChatGPT，再粘贴到新对话。回答会留在你的 ChatGPT 对话中。')}</p><label htmlFor="follow-up">{say('Add your question (optional)', '加上你的问题（可选）')}</label><input id="follow-up" value={question} onChange={event => { setQuestion(event.target.value); setCopied(false); }} maxLength={1000}/><label htmlFor="study-prompt">{say('Study prompt', '学习提示')}</label><textarea id="study-prompt" value={prompt} readOnly rows={9}/><div className="hero-actions"><button className="primary" onClick={() => void copyPrompt()}>{copied ? say('✓ Prompt copied', '✓ 已复制提示') : say('1. Copy study prompt', '1. 复制学习提示')}</button><a className="secondary" href="https://chatgpt.com/" target="_blank" rel="noreferrer">{say('2. Open my ChatGPT ↗', '2. 打开我的 ChatGPT ↗')}</a></div>{copied && <p role="status">{say('Copied. Paste it into your ChatGPT conversation.', '已复制。请粘贴到你的 ChatGPT 对话中。')}</p>}{copyError && <p role="alert">{say('Copying was blocked. Select the study prompt above and copy it manually.', '复制被浏览器阻止，请选中上方学习提示，手动复制。')}</p>}</section></div>}
  </div>;
}
