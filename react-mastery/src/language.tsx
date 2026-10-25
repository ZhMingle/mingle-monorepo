import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { translate } from '../shared/i18n.ts';
import type { Language } from '../shared/i18n.ts';

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (text: string) => string } | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('clarity.language') === 'zh' ? 'zh' : 'en'; } catch { return 'en'; }
  });
  function setLanguage(next: Language) {
    try { localStorage.setItem('clarity.language', next); } catch { /* Preference remains usable without storage. */ }
    updateLanguage(next);
  }
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t: text => translate(text, language) }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider is required');
  return value;
}
