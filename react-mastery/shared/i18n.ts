import { uiZh } from './locales/ui-zh.ts';
import { contentZh } from './locales/content-zh.ts';
import { supportZh } from './locales/support-zh.ts';
export type Language = 'en' | 'zh';
export const chineseMessages: Record<string, string> = { ...contentZh, ...supportZh, ...uiZh };
export function translate(text: string, language: Language): string {
  if (text === '&lt; / &gt;') return '< / >';
  return language === 'zh' ? chineseMessages[text] ?? text : text;
}
