
import React from 'react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-all duration-500">
      <div 
        className="relative bg-zinc-900 border-2 border-orange-500 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-[0_0_50px_rgba(249,115,22,0.3)] animate-in fade-in zoom-in duration-300"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-orange-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-bold text-orange-500 mb-8 border-b-2 border-orange-500/30 pb-4">
          {title}
        </h2>
        
        <div className="text-zinc-200 text-lg leading-relaxed space-y-4">
          {content}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
