import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...compat.config({
    extends: ['prettier'],
    plugins: ['prettier'],
    rules: {
      'prettier/prettier': 'error',

      // ✅ 添加你的自定义规则
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // ✅ 关闭 unescaped entity 报错
      'react/no-unescaped-entities': 'off',

      // ✅ 保留 hooks 检查
      'react-hooks/rules-of-hooks': 'error',
    },
  }),
];

export default eslintConfig;
