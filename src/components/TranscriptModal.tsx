import React from 'react';
import { CloseIcon } from './icons';

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
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Call Transcript</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {transcript}
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
