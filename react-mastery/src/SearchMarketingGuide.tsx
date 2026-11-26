import { marketingPaths } from '../shared/paths-marketing.ts';
import { useLanguage } from './language.tsx';

export function SearchMarketingGuide({current}:{current?:string}) {
  const {language}=useLanguage();
  const say=(en:string,zh:string)=>language==='zh'?zh:en;
  return <section className="marketing-guide" aria-label={say('Search Marketing study order','搜索营销学习顺序')}>
    <h2>{say('Search Marketing · one subject, six paths','搜索营销 · 一个主题，六条路线')}</h2>
    <p>{say('Start with fundamentals and metrics. Learn Ads and SEO in parallel, then measurement, ecommerce and AI search/reporting. Each path tracks its own progress, and you can switch whenever you need.','先学基础与指标，再并行学习 Ads 和 SEO，接着学测量、电商与 AI 搜索／报告。每条路线独立记录进度，可随时切换。')}</p>
    <nav aria-label={say('Search Marketing paths','搜索营销路线')}><ol>{marketingPaths.map((path,i)=><li key={path.id}><a href={`#roadmap/${path.id}`} aria-current={current===path.id?'page':undefined}><span>{String(i+1).padStart(2,'0')}</span>{path.name[language]}</a></li>)}</ol></nav>
    <p className="marketing-resources"><strong>{say('Learning resources: ','学习资源：')}</strong>{[
      ['Google Skillshop','https://skillshop.withgoogle.com/'],['Google Search Central','https://developers.google.com/search/docs'],['Semrush Academy','https://www.semrush.com/academy/'],['Ahrefs Academy','https://ahrefs.com/academy'],['Shopify Help Center','https://help.shopify.com/en/manual/promoting-marketing/seo']
    ].map(([name,url])=><a key={url} href={url} target="_blank" rel="noreferrer">{name} ↗</a>)}</p>
  </section>;
}
