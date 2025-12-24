
import React, { useState } from 'react';
import { FeaturedMedia } from '../types';

interface FeaturedMediaCardProps {
  media: FeaturedMedia;
  onClick: () => void;
}

const FeaturedMediaCard: React.FC<FeaturedMediaCardProps> = ({ media, onClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="perspective-1000 w-full aspect-[16/10] cursor-pointer group"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={onClick}
    >
      <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden">
          <div className="w-full h-full bg-zinc-950 border border-orange-500/20 rounded-[2rem] p-8 flex flex-col justify-between items-start hover:border-orange-500/60 transition-colors shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-transparent opacity-40"></div>
            
            <div className="w-full">
              <span className="bg-orange-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase mb-4 inline-block shadow-lg">
                Featured {media.type === 'album' ? 'Production' : 'Cine-Work'}
              </span>
              <h3 className="text-3xl font-black text-white italic uppercase leading-none tracking-tighter group-hover:text-orange-500 transition-colors">{media.title}</h3>
            </div>

            <div className="w-full flex justify-between items-center text-zinc-700 text-[8px] font-black uppercase tracking-widest pt-4 border-t border-white/5">
              <span>Verified Asset</span>
              <span>{media.releaseDate.slice(-4)}</span>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="w-full h-full bg-zinc-950 border border-orange-500 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-2xl">
            <h3 className="text-orange-500 text-xl font-black mb-4 italic uppercase">{media.title}</h3>
            <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-6 mb-6 font-bold">
              {media.description}
            </p>
            <div className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.3em] px-6 py-2 border border-orange-500/20 rounded-full group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
              Details & Network
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .perspective-1000 { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FeaturedMediaCard;
