'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// 动态导入 ReactMarkdown 用于预览
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

// 动态导入 MDEditor 避免 SSR 问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
}

interface MarkdownPreviewProps {
  value: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter your content...',
  className,
  height = 400,
  preview = 'live',
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'live'>(preview);

  const handleChange = (val?: string) => {
    onChange(val || '');
  };

  return (
    <div className={cn('markdown-editor', className)}>
      <MDEditor
        value={value}
        onChange={handleChange}
        preview={mode}
        height={height}
        data-color-mode="auto"
        textareaProps={{
          placeholder,
          style: {
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          },
        }}
        previewOptions={{
          style: {
            fontSize: 14,
            lineHeight: 1.6,
          },
        }}
      />

      {/* 自定义模式切换按钮 */}
      <div className="flex justify-end mt-2 space-x-2">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            mode === 'edit'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('live')}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            mode === 'live'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          Live
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            mode === 'preview'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          Preview
        </button>
      </div>
    </div>
  );
}

// 独立的 Markdown 预览组件
export function MarkdownPreview({ value, className }: MarkdownPreviewProps) {
  return (
    <div className={cn('markdown-preview', className)}>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="markdown-content text-sm text-gray-800 dark:text-gray-200">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mb-3 mt-6 text-gray-900 dark:text-gray-100">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium mb-2 mt-4 text-gray-900 dark:text-gray-100">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 pl-6 space-y-2 list-disc text-gray-800 dark:text-gray-200">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 pl-6 space-y-2 list-decimal text-gray-800 dark:text-gray-200">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
                  {children}
                </blockquote>
              ),
              code: ({ children, className, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code
                    className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className="block bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 p-3 rounded-md text-sm font-mono overflow-x-auto whitespace-pre"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-gray-100 dark:bg-gray-600 p-3 rounded-md overflow-x-auto mb-4">
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-800 dark:text-gray-200">
                  {children}
                </em>
              ),
            }}
          >
            {value || '*暂无内容*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default MarkdownEditor;
