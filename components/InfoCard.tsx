
import React, { useRef, useState } from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  showExpandIcon?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children, onClick, className = "", showExpandIcon = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: rotate.x === 0 ? 'all 0.5s ease-out' : 'transform 0.1s ease-out'
      }}
      className={`group relative bg-zinc-900 border border-orange-500/30 rounded-3xl p-8 transition-all duration-300 hover:border-orange-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] cursor-pointer overflow-hidden transform-gpu z-10 ${className}`}
    >
      {showExpandIcon && (
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      )}
      {title && (
        <h3 className="text-orange-500 font-black text-base mb-6 border-b border-orange-500/20 pb-4 flex items-center gap-3 italic uppercase tracking-wider">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"></span>
          {title}
        </h3>
      )}
      <div className="text-zinc-300 font-medium leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default InfoCard;
