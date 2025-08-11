'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import esMessages from '@/messages/es.json';

// 支持的语言列表
export const locales = ['en', 'zh', 'es'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'en';

// 预加载的消息
const preloadedMessages = {
  en: enMessages,
  zh: zhMessages,
  es: esMessages,
};

// 语言消息类型
export type Messages = Record<string, any>;

// Zustand store for language management
interface I18nStore {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  setMessages: (messages: Messages) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

// Helper function to get nested object value by key
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to replace placeholders in text
function replacePlaceholders(
  text: string,
  params: Record<string, any> = {}
): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] || match;
  });
}

// 从localStorage获取初始语言设置
function getInitialState() {
  if (typeof window === 'undefined') {
    return {
      locale: defaultLocale,
      messages: preloadedMessages[defaultLocale],
    };
  }

  // 尝试从localStorage读取保存的语言设置
  const stored = localStorage.getItem('i18n-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const savedLocale = parsed.state?.locale || defaultLocale;
      return {
        locale: savedLocale as Locale,
        messages:
          preloadedMessages[savedLocale as Locale] ||
          preloadedMessages[defaultLocale],
      };
    } catch {
      // 如果解析失败，使用默认值
    }
  }

  return {
    locale: defaultLocale,
    messages: preloadedMessages[defaultLocale],
  };
}

const initialState = getInitialState();

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: initialState.locale,
      messages: initialState.messages,
      setLocale: (locale: Locale) => {
        // 切换语言时同时更新消息
        set({
          locale,
          messages:
            preloadedMessages[locale] || preloadedMessages[defaultLocale],
        });
      },
      setMessages: (messages: Messages) => set({ messages }),
      t: (key: string, params?: Record<string, any>) => {
        const { messages, locale } = get();

        // 如果消息为空，尝试加载当前语言的消息
        if (!messages || Object.keys(messages).length === 0) {
          const fallbackMessages =
            preloadedMessages[locale] || preloadedMessages[defaultLocale];
          if (fallbackMessages) {
            set({ messages: fallbackMessages });
            const value = getNestedValue(fallbackMessages, key);
            if (typeof value === 'string') {
              return replacePlaceholders(value, params);
            }
          }
        }

        const value = getNestedValue(messages, key);

        if (typeof value === 'string') {
          return replacePlaceholders(value, params);
        }

        // Return the key if translation not found
        return key;
      },
    }),
    {
      name: 'i18n-storage',
      partialize: state => ({ locale: state.locale }),
      onRehydrateStorage: () => state => {
        // 当从localStorage恢复状态时，确保消息也被加载
        if (state && state.locale) {
          const messages =
            preloadedMessages[state.locale] || preloadedMessages[defaultLocale];
          state.setMessages(messages);
        }
      },
    }
  )
);

// Hook to load messages for a locale
export async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    const messages = await import(`../messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to English messages
    if (locale !== 'en') {
      return loadMessages('en');
    }
    return {};
  }
}
