import React from 'react';
import { CloseIcon } from '@/components/icons';

export interface TranscriptModalProps {
  isOpen: boolean;
  transcript: string;
  onClose: () => void;
}

export const TranscriptModal: React.FC<TranscriptModalProps> = ({
  isOpen,
  transcript,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Call Transcript
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600">
          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {transcript}
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
