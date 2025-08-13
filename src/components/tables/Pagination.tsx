import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  onPageChange,
  loading = false,
}) => {
  // Pagination state
  const [showPageInput, setShowPageInput] = useState<boolean>(false);
  const [pageInputValue, setPageInputValue] = useState<string>('');
  const pageInputRef = useRef<HTMLInputElement>(null);

  // Handle page input change
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (
      value === '' ||
      (/^\d+$/.test(value) && parseInt(value) <= totalPages)
    ) {
      setPageInputValue(value);
    }
  };

  // Handle page jump
  const handlePageJump = () => {
    const targetPage = parseInt(pageInputValue);
    if (targetPage >= 1 && targetPage <= totalPages) {
      onPageChange(targetPage);
      setPageInputValue('');
      setShowPageInput(false);
    }
  };

  // Handle current page click
  const handleCurrentPageClick = () => {
    setShowPageInput(true);
    setPageInputValue(page.toString());
    setTimeout(() => {
      pageInputRef.current?.focus();
      pageInputRef.current?.select();
    }, 0);
  };

  // Handle cancel page input
  const handleCancelPageInput = () => {
    setShowPageInput(false);
    setPageInputValue('');
  };

  // Handle Enter key press in page input
  const handlePageInputKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      handlePageJump();
    } else if (e.key === 'Escape') {
      handleCancelPageInput();
    } else if (e.key === 'ArrowUp' || e.key === '+') {
      e.preventDefault();
      const currentValue = parseInt(pageInputValue) || page;
      const newValue = Math.min(currentValue + 1, totalPages);
      setPageInputValue(newValue.toString());
    } else if (e.key === 'ArrowDown' || e.key === '-') {
      e.preventDefault();
      const currentValue = parseInt(pageInputValue) || page;
      const newValue = Math.max(currentValue - 1, 1);
      setPageInputValue(newValue.toString());
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
      <span className="text-gray-600 dark:text-gray-300 text-sm">
        Page {page} of {totalPages} (Total: {total} records)
      </span>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          onClick={() => {
            handleCancelPageInput();
            onPageChange(page - 1);
          }}
          disabled={page <= 1 || loading}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>

        {/* Current Page Display/Input */}
        {showPageInput ? (
          <div className="flex items-center gap-2">
            <input
              ref={pageInputRef}
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyPress}
              placeholder="Page"
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
            <Button
              onClick={handlePageJump}
              disabled={
                !pageInputValue ||
                parseInt(pageInputValue) < 1 ||
                parseInt(pageInputValue) > totalPages ||
                loading
              }
              size="sm"
              variant="outline"
            >
              Go
            </Button>
            <Button onClick={handleCancelPageInput} size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleCurrentPageClick}
            disabled={loading}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 min-w-[40px]"
            title="Click to jump to a specific page"
          >
            {page}
          </Button>
        )}

        {/* Next Button */}
        <Button
          onClick={() => {
            handleCancelPageInput();
            onPageChange(page + 1);
          }}
          disabled={page >= totalPages || loading}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
