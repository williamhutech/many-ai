import React from 'react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function AuthModal({ isOpen, onClose, children }: AuthModalProps) {
  if (!isOpen) return null;

  // The overlay and modal styling is similar to your existing "Modal" component,
  // including the backdrop blur. Feel free to tweak as desired.
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "w-[calc(100%-2rem)] sm:w-full max-w-lg",
          "max-h-[85vh] bg-white rounded-lg shadow-lg p-6 sm:p-8 overflow-y-auto"
        )}
      >
        {/* Optional Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Authentication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Modal Content (Auth Pages) */}
        {children}
      </div>
    </>
  );
} 