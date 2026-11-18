import {useState} from 'react';
import {learningShareUrl} from '../shared/sharing.ts';
import {useLanguage} from './language.tsx';

export default function ShareLearningPath({pathId = ''}: {pathId?: string}) {
  const {language} = useLanguage();
  const [copied, setCopied] = useState('');
  const [failed, setFailed] = useState('');
  const url = learningShareUrl(pathId);
  const say = (en: string, zh: string) => language === 'zh' ? zh : en;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(url); setFailed(''); }
    catch { setFailed(url); }
  }
  return <div className="path-sharing"><button className="secondary" onClick={() => void copy()}>{copied === url ? say('Link copied', '链接已复制') : say('Copy learning path link', '复制路线链接')}</button><span role="status">{failed === url ? <a href={url} target="_blank" rel="noreferrer">{say('Open the link to copy it', '打开链接后复制地址')}</a> : copied === url ? say('Anyone can browse this route. Your progress stays private.', '别人打开即可浏览路线，你的学习进度保持私密。') : say('Share the curriculum with others.', '分享给别人，直接查看学习路线。')}</span></div>;
}
