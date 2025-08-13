'use client';

import { useEffect } from 'react';
import { useI18n as useI18nStore } from '@/lib/i18n-client';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import esMessages from '@/messages/es.json';

const preloadedMessages = {
  en: enMessages,
  zh: zhMessages,
  es: esMessages,
};

/**
 * Client-side hook to ensure i18n messages are always loaded
 * This hook handles the hydration issue where messages might be empty on initial render
 */
export function useI18nClient() {
  const store = useI18nStore();
  const { locale, messages, setMessages, t } = store;

  useEffect(() => {
    // Ensure messages are loaded for current locale
    if (!messages || Object.keys(messages).length === 0) {
      const localeMessages =
        preloadedMessages[locale as keyof typeof preloadedMessages] ||
        preloadedMessages.en;
      setMessages(localeMessages);
    }
  }, [locale, messages, setMessages]);

  // Override the t function to handle empty messages
  const safeT = (key: string, params?: Record<string, any>): string => {
    // First try the original t function
    const result = t(key, params);

    // If it returns the key (meaning translation not found),
    // try to load messages and translate again
    if (result === key && (!messages || Object.keys(messages).length === 0)) {
      const fallbackMessages =
        preloadedMessages[locale as keyof typeof preloadedMessages] ||
        preloadedMessages.en;
      const keys = key.split('.');
      let value: any = fallbackMessages;

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }

      if (typeof value === 'string') {
        // Replace placeholders if params provided
        if (params) {
          return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] || match;
          });
        }
        return value;
      }
    }

    return result;
  };

  return {
    ...store,
    t: safeT,
  };
}
