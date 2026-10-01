import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay - z-index: 1000 */}
      <div
        className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window Container - z-index: 1001 */}
      <div className="fixed inset-0 z-[1001] overflow-y-auto p-3 sm:p-4 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-[calc(100%-24px)] sm:w-full max-w-xl max-h-[calc(100vh-32px)] my-auto flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ease-out opacity-100 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950 shrink-0">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-200">{children}</div>
        </div>
      </div>
    </>
  );
}
