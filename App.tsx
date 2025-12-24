
import React, { useState, useEffect, useRef } from 'react';
import { CelebrityData, SectionType, FamousWork, Work, RelatedCelebrity } from './types';
import { fetchCelebrityData, getSuggestions } from './services/geminiService';
import InfoCard from './components/InfoCard';
import DetailModal from './components/DetailModal';
import FeaturedMediaCard from './components/FeaturedMediaCard';

const STAR_RANKS = [
  { range: [0.0, 1.0], title: '演藝廢料' },
  { range: [1.0, 2.0], title: '七流藝人' },
  { range: [2.0, 3.0], title: '六流藝人' },
  { range: [3.0, 4.0], title: '五流藝人' },
  { range: [4.0, 5.0], title: '四流藝人' },
  { range: [5.0, 6.0], title: '三流藝人' },
  { range: [6.0, 7.0], title: '二流藝人' },
  { range: [7.0, 8.0], title: '一流藝人' },
  { range: [8.0, 9.0], title: '頂流藝人' },
  { range: [9.0, 10.1], title: '跨世代傳奇' },
];

const CELEBRITY_POOL = [
  "Taylor Swift", "Michael Jackson", "周杰倫", "Lady Gaga", "Tom Cruise", "Kanye West", 
  "Lisa", "IU", "Brad Pitt", "Beyonce", "Justin Bieber", "Emma Watson", 
  "Leonardo DiCaprio", "Rihanna", "Drake", "Ariana Grande", "BTS", "Blackpink", 
  "林俊傑", "蔡依林", "Eminem", "Selena Gomez", "The Weeknd", "Dua Lipa", 
  "Robert Downey Jr.", "Scarlett Johansson", "Zendaya", "Tom Holland", "Billie Eilish", "Adele"
];

const RadarChart: React.FC<{ rating: number }> = ({ rating }) => {
  const size = 260; // 稍微調大一點
  const center = size / 2;
  const radius = size * 0.32;
  const angleStep = (Math.PI * 2) / 5;
  
  // 基於評分的動態維度數據
  const dims = [
    { name: '權威影響', weight: 0.7 + (rating / 35) },
    { name: '商業價值', weight: 0.6 + (rating / 40) },
    { name: '大眾認知', weight: 0.8 + (rating / 30) },
    { name: '專業地位', weight: 0.7 + (rating / 33) },
    { name: '產出效率', weight: 0.5 + (rating / 25) },
  ];
  
  const points = dims.map((d, i) => {
    const val = Math.min(1, d.weight) * radius;
    const x = center + val * Math.cos(i * angleStep - Math.PI / 2);
    const y = center + val * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');
  
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  
  return (
    <div className="relative w-full flex justify-center py-6">
      <svg width={size} height={size} className="overflow-visible">
        {gridLevels.map((lvl, idx) => (
          <polygon 
            key={idx} 
            points={dims.map((_, i) => {
              const r = lvl * radius;
              return `${center + r * Math.cos(i * angleStep - Math.PI / 2)},${center + r * Math.sin(i * angleStep - Math.PI / 2)}`;
            }).join(' ')} 
            className="fill-none stroke-zinc-800" 
            strokeWidth="1" 
          />
        ))}
        {dims.map((_, i) => (
          <line 
            key={i} 
            x1={center} 
            y1={center} 
            x2={center + radius * Math.cos(i * angleStep - Math.PI / 2)} 
            y2={center + radius * Math.sin(i * angleStep - Math.PI / 2)} 
            className="stroke-zinc-800" 
            strokeWidth="1" 
          />
        ))}
        <polygon points={points} className="fill-orange-500/30 stroke-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" strokeWidth="2.5" />
        {dims.map((d, i) => (
          <text 
            key={i} 
            x={center + (radius + 35) * Math.cos(i * angleStep - Math.PI / 2)} 
            y={center + (radius + 35) * Math.sin(i * angleStep - Math.PI / 2)} 
            textAnchor="middle" 
            alignmentBaseline="middle"
            className="fill-white font-black text-[12px] uppercase tracking-wider italic drop-shadow-md"
          >
            {d.name}
          </text>
        ))}
      </svg>
    </div>
  );
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [data, setData] = useState<CelebrityData | null>(null);
  const [history, setHistory] = useState<CelebrityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ type: SectionType | 'rankTable' | 'history'; title: string; extra?: any } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recommended, setRecommended] = useState<string[]>([]);
  const debounceRef = useRef<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const currentSearchId = useRef<number>(0);
  const [globalMousePos, setGlobalMousePos] = useState({ x: 0, y: 0 });
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const shuffled = [...CELEBRITY_POOL].sort(() => 0.5 - Math.random());
    setRecommended(shuffled.slice(0, 8));

    const saved = localStorage.getItem('starpulse_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
    const handleGlobalMouseMove = (e: MouseEvent) => { setGlobalMousePos({ x: e.clientX, y: e.clientY }); };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let interval: number;
    if (loading) {
      setLoadingProgress(0);
      interval = window.setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 99.5) return 99.5;
          const increment = 0.166; 
          return prev + increment;
        });
      }, 100);
    } else {
      setLoadingProgress(0);
    }
    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length > 1) {
      debounceRef.current = window.setTimeout(async () => {
        const list = await getSuggestions(query);
        setSuggestions(list);
        setShowSuggestions(true);
      }, 500);
    } else {
      setSuggestions([]);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const performSearch = async (targetName: string) => {
    const searchId = ++currentSearchId.current;
    setLoading(true);
    setError(null);
    setData(null);
    setQuery(targetName);
    setShowSuggestions(false);
    setSelectedSection(null);
    try {
      const result = await fetchCelebrityData(targetName);
      if (searchId === currentSearchId.current) {
        setLoadingProgress(100);
        setTimeout(() => {
          if (searchId === currentSearchId.current) {
            setData(result);
            setLoading(false);
          }
        }, 600);
        setHistory(prev => {
          const filtered = prev.filter(item => item.name.toLowerCase() !== result.name.toLowerCase());
          const newHistory = [result, ...filtered].slice(0, 10);
          localStorage.setItem('starpulse_history', JSON.stringify(newHistory));
          return newHistory;
        });
      }
    } catch (err: any) {
      if (searchId === currentSearchId.current) {
        setError(err.message || "搜尋失敗。");
        setLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performSearch(query);
  };

  const cancelSearch = () => {
    currentSearchId.current++;
    setLoading(false);
    setLoadingProgress(0);
  };

  const openDetail = (type: SectionType | 'rankTable' | 'history', title: string, extra?: any) => {
    setSelectedSection({ type, title, extra });
  };

  const closeDetail = () => { setSelectedSection(null); };

  const getRankTitle = (rating: number) => {
    const rank = STAR_RANKS.find(r => rating >= r.range[0] && rating < r.range[1]);
    return rank?.title || (rating >= 9.0 ? STAR_RANKS[9].title : 'Unknown');
  };

  const renderBasicInfo = (data: CelebrityData) => {
    const info = data.basicInfo;
    const social = data.socialLinks;
    return (
      <div className="space-y-6 text-zinc-300">
        <ul className="space-y-4 text-base">
          {data.originalName && <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">本名 ORIGINAL NAME</span> {data.originalName}</li>}
          {data.stageName && <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">藝名 STAGE NAME</span> {data.stageName}</li>}
          <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">性別 GENDER</span> {info.gender}</li>
          <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">年齡 AGE</span> {info.age}</li>
          <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">國籍 NATIONALITY</span> {info.nationality}</li>
          <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">生日 BIRTHDAY</span> {info.birthDate}</li>
          <li><span className="text-orange-500 font-black uppercase text-[12px] tracking-widest block mb-1">伴侶 SPOUSE</span> {info.spouse}</li>
        </ul>
        <div className="mt-8 border-t border-orange-500/20 pt-8 text-center">
          <h4 className="text-orange-500 font-black text-[10px] mb-6 italic tracking-[0.3em] uppercase underline decoration-orange-500/30">社交媒體連結 / SOCIAL MATRIX</h4>
          <div className="flex justify-center gap-6">
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all border border-white/5"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg></a>}
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all border border-white/5"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>}
            {social.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all border border-white/5"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>}
          </div>
        </div>
      </div>
    );
  };

  const renderNameInHero = (data: CelebrityData) => {
    // 優先顯示藝名
    const displayName = data.stageName || data.name;
    let chinese = "";
    let english = "";
    if (displayName.includes(" (")) {
      const parts = displayName.split(" (");
      chinese = parts[0];
      english = parts[1].replace(")", "");
    } else {
      chinese = displayName;
    }
    return (
      <div className="flex flex-col gap-4 items-center">
        <div className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black text-white italic uppercase leading-tight drop-shadow-2xl text-center">
          {chinese}
        </div>
        {english && (
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-500 italic uppercase tracking-[0.3em] text-center">
            {english}
          </div>
        )}
      </div>
    );
  };

  const renderAwards = (awards: string[], isDetailed: boolean) => (
    <div className="space-y-4">
      <ul className="list-none space-y-4">
        {awards.slice(0, isDetailed ? 200 : 5).map((award, i) => (
          <li key={i} className="flex items-start gap-3 text-base leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
            <span className="text-orange-500 mt-1.5 shrink-0 text-xs">◆</span>
            <span>{award}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderRelatedArtists = (artists: RelatedCelebrity[], isDetailed: boolean) => (
    <div className={`flex flex-col gap-4 ${!isDetailed ? 'max-h-[400px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
      {artists.slice(0, isDetailed ? 50 : 8).map((person, i) => (
        <button key={i} onClick={(e) => { e.stopPropagation(); performSearch(person.name); }} className={`w-full text-left bg-black/40 border border-orange-500/10 rounded-[1.5rem] transition-all group/btn relative overflow-hidden flex flex-col justify-center min-h-[100px] p-6 hover:border-orange-500 hover:bg-orange-500/5`}>
          <div className={`text-white font-black italic uppercase tracking-tight transition-all duration-300 group-hover/btn:opacity-0 ${isDetailed ? 'text-4xl' : 'text-base'}`}>{person.name}</div>
          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-all duration-300 px-8 text-center backdrop-blur-[2px]">
            <div className={`text-orange-500 font-black italic uppercase tracking-tighter leading-tight ${isDetailed ? 'text-3xl' : 'text-xl'}`}>關係：{person.relationship}</div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderWorks = (works: Work[], isDetailed: boolean) => (
    <ul className="space-y-5">
      {works.slice(0, isDetailed ? 1000 : 8).map((work, idx) => (
        <li key={idx} onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/search?q=${encodeURIComponent(work.title)}`, '_blank'); }} className="border-l-2 border-orange-500/20 pl-6 py-3 flex justify-between items-center group hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer transition-all rounded-r-2xl">
          <div className="max-w-[80%]">
            <div className="text-white font-black group-hover:text-orange-500 transition-colors uppercase italic tracking-tighter text-base">{work.title}</div>
            <div className="text-zinc-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{work.year} {work.role && `| ${work.role}`}</div>
          </div>
        </li>
      ))}
    </ul>
  );

  const getModalContent = () => {
    if (!selectedSection || !data) return null;
    switch (selectedSection.type) {
      case 'basic': return renderBasicInfo(data);
      case 'awards': return renderAwards(data.basicInfo.awards, true);
      case 'story': return <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-2xl italic font-medium">{data.careerStory}</p>;
      case 'growth': return <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-2xl italic font-medium">{data.growthBackground}</p>;
      case 'related': return renderRelatedArtists(data.relatedCelebrities, true);
      case 'works': return renderWorks(data.works, true);
      case 'famous': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.famousWorks.map((f, i) => (
            <a key={i} href={f.youtubeUrl} target="_blank" rel="noopener noreferrer" className="bg-zinc-950 p-8 rounded-[2rem] border border-orange-500/20 hover:border-orange-500 transition-all group/famous flex flex-col justify-between aspect-video">
              <div className="flex justify-between items-start">
                 <h4 className="text-2xl font-black text-white italic uppercase leading-tight group-hover/famous:text-orange-500 transition-colors max-w-[80%]">{f.title}</h4>
                 <div className="text-red-600"><svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></div>
              </div>
            </a>
          ))}
        </div>
      );
      case 'rating': return (
        <div className="text-center py-16 px-6">
          <div className="text-[12rem] font-black text-orange-500 mb-0 italic leading-none">{data.popularityRating.toFixed(1)}</div>
          <div className="text-4xl font-black text-white mb-6 uppercase tracking-[0.4em] italic opacity-40">Authoritative Metric Report</div>
          <RadarChart rating={data.popularityRating} />
          <div className="text-black font-black text-3xl mb-16 uppercase tracking-[0.2em] italic bg-orange-500 px-14 py-5 rounded-full shadow-2xl">等級稱號：{getRankTitle(data.popularityRating)}</div>
          <div className="bg-zinc-950 border border-orange-500/20 p-16 rounded-[4rem] text-left max-w-4xl mx-auto shadow-2xl relative">
            <h4 className="text-orange-500 font-black text-xs uppercase tracking-[0.5em] mb-10 italic border-b border-orange-500/10 pb-6">Justification Summary</h4>
            <p className="text-zinc-300 text-2xl leading-relaxed italic font-medium">{data.ratingJustification}</p>
          </div>
        </div>
      );
      case 'media': return (
        <div className="space-y-12">
           <div className="bg-zinc-950 p-16 rounded-[4rem] border border-orange-500/20 text-center relative overflow-hidden shadow-2xl">
              <h3 className="text-6xl md:text-8xl font-black text-white italic uppercase leading-tight mb-10 tracking-tighter">{data.featuredMedia.title}</h3>
              <p className="text-zinc-300 leading-relaxed text-3xl max-w-4xl mx-auto italic font-medium">{data.featuredMedia.description}</p>
           </div>
        </div>
      );
      default: return null;
    }
  };

  const getTitleGradient = () => {
    if (!titleRef.current) return 'none';
    const rect = titleRef.current.getBoundingClientRect();
    const x = globalMousePos.x - rect.left;
    const y = globalMousePos.y - rect.top;
    return `radial-gradient(circle 500px at ${x}px ${y}px, #f97316 0%, rgba(249, 115, 22, 0.4) 50%, rgba(249, 115, 22, 0.1) 100%)`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-black text-white selection:bg-orange-500 selection:text-black overflow-x-hidden relative">
      <div className="fixed pointer-events-none z-[0] w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px] transition-all duration-1000 animate-pulse" style={{ left: globalMousePos.x - 400, top: globalMousePos.y - 400 }} />
      <div className="w-full max-w-7xl mb-20 border-b border-zinc-900 pb-12 relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="w-[180px]"></div>
        {history.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em] pt-3">Archives:</span>
            {history.slice(0, 6).map((h, i) => (
              <button key={i} onClick={() => setData(h)} className="text-[10px] font-black uppercase text-orange-500/30 hover:text-orange-500 transition-all px-6 py-3 bg-zinc-950 border border-orange-500/5 hover:border-orange-500/40 rounded-2xl shadow-inner active:scale-90">{h.name}</button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl mb-24 text-center relative z-40">
        <div className="flex justify-center items-center w-full px-12 py-16 sm:py-24">
          <h1 ref={titleRef} className="text-7xl sm:text-8xl md:text-[10rem] lg:text-[13.5rem] font-black tracking-tighter italic leading-none select-none relative z-10 text-[#111] hover:text-transparent pr-12 lg:pr-24 transition-colors duration-300" style={{ backgroundImage: getTitleGradient(), WebkitBackgroundClip: 'text', backgroundClip: 'text', overflow: 'visible', display: 'inline-block' }}>STARPULSE</h1>
        </div>
        <div className="flex items-center justify-center gap-6 mb-16">
           <div className="h-px w-20 bg-orange-500/20"></div>
           <p className="text-zinc-800 font-black text-[12px] uppercase tracking-[1.2em] italic">Authority Neural Bio-Archive // v6.5 Master</p>
           <div className="h-px w-20 bg-orange-500/20"></div>
        </div>
        <div ref={searchContainerRef} className="relative max-w-3xl mx-auto group">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-3xl group-focus-within:bg-orange-500/50 transition-all duration-1000"></div>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => query.length > 0 && setShowSuggestions(true)} placeholder="搜尋藝人 (如: Michael Jackson, IU)..." className="w-full bg-zinc-950/90 backdrop-blur-3xl border border-orange-500/20 text-white rounded-full py-10 px-16 pr-32 focus:outline-none focus:border-orange-500 transition-all text-2xl shadow-[0_50px_100px_rgba(0,0,0,0.9)] font-bold placeholder:text-zinc-900 relative z-10" />
            <button type="submit" className="absolute right-6 top-6 bottom-6 bg-orange-500 hover:bg-orange-600 text-black rounded-full px-14 flex items-center justify-center transition-all group z-20 active:scale-95 shadow-2xl">{loading ? <div className="w-8 h-8 border-[6px] border-black/30 border-t-black rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}</button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-2 relative z-10 px-4">
            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] self-center mr-2">Authority Suggestions:</span>
            {recommended.map((name) => (
              <button
                key={name}
                onClick={() => performSearch(name)}
                className="px-5 py-2 bg-zinc-950/50 border border-orange-500/10 rounded-full text-[9px] font-black uppercase text-orange-500/40 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-500/10 transition-all active:scale-90"
              >
                {name}
              </button>
            ))}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-6 bg-zinc-950/95 border border-orange-500/20 rounded-[4rem] overflow-hidden shadow-[0_70px_140px_rgba(0,0,0,1)] z-50 text-left backdrop-blur-3xl p-4">
              {suggestions.map((s, idx) => (<div key={idx} onClick={() => performSearch(s)} className="px-12 py-8 hover:bg-orange-500 hover:text-black cursor-pointer transition-all border-b border-white/5 last:border-0 font-black text-3xl italic uppercase tracking-tighter rounded-3xl">{s}</div>))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden">
           <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-[210]"></div>
           <div className="w-full max-w-3xl px-12 text-center flex flex-col items-center relative z-[220]">
              <div className="text-orange-500 font-black text-5xl md:text-7xl tracking-tighter italic mb-16 uppercase animate-pulse leading-tight drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">Syncing Neural<br/>Database</div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden relative shadow-2xl mb-8 border border-white/5">
                 <div className="h-full bg-orange-500 transition-all duration-300 ease-out shadow-[0_0_25px_#f97316]" style={{ width: `${loadingProgress}%` }}></div>
              </div>
              <div className="flex justify-between items-center w-full px-2 mb-20">
                <div className="text-orange-500/40 font-black text-[10px] uppercase tracking-[0.4em] italic">Authority Verification // {Math.floor(loadingProgress * 1234)}</div>
                <div className="text-orange-500 font-mono text-xl font-black">{Math.round(loadingProgress)}%</div>
              </div>
              <button onClick={cancelSearch} className="group relative px-10 py-4 bg-zinc-950 border border-white/5 rounded-full hover:border-orange-500 transition-all active:scale-95 overflow-hidden shadow-2xl">
                <span className="text-zinc-600 group-hover:text-orange-500 font-black uppercase text-[12px] tracking-[0.3em] italic transition-colors relative z-10">Cancel Uplink</span>
              </button>
           </div>
        </div>
      )}

      {data && (
        <div className="w-full max-w-[1800px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-60 animate-in fade-in zoom-in duration-1000 px-6 relative z-10">
          <div className="lg:col-span-3 space-y-12">
            <InfoCard title="全球權威指數 / TIER INDEX" onClick={() => openDetail('rating', '全球權威指數 / TIER INDEX')} className="min-h-[200px] flex flex-col justify-center bg-zinc-950/80">
              <div className="text-4xl xl:text-5xl font-black text-orange-500 italic drop-shadow-[0_4px_25px_rgba(249,115,22,0.5)] uppercase">{getRankTitle(data.popularityRating)}</div>
              <div className="mt-4 text-[4.5rem] font-black text-white/5 leading-none absolute right-4 bottom-4">{data.popularityRating.toFixed(1)}</div>
              <div className="mt-6 opacity-40"><RadarChart rating={data.popularityRating} /></div>
            </InfoCard>
            <InfoCard title="檔案資料 / BIO" onClick={() => openDetail('basic', '檔案資料 / BIO')}>{renderBasicInfo(data)}</InfoCard>
            <InfoCard title="相關藝人 / RELATED" onClick={() => openDetail('related', '相關藝人 / RELATED')}>{renderRelatedArtists(data.relatedCelebrities, false)}</InfoCard>
            <InfoCard title="成長背景 / ORIGIN" onClick={() => openDetail('growth', '成長背景 / ORIGIN')}><p className="text-zinc-500 leading-relaxed line-clamp-[8] italic text-base font-medium">{data.growthBackground}</p></InfoCard>
          </div>
          <div className="lg:col-span-6 space-y-12">
            <InfoCard title="主頁資訊 / PRIMARY HERO" onClick={() => {}} className="relative aspect-[16/11] bg-zinc-950 border-2 border-orange-500/20 rounded-[5rem] flex flex-col items-center justify-center p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)] cursor-default overflow-hidden" showExpandIcon={false}>
               <div className="relative z-10 text-center w-full max-w-full">
                  {renderNameInHero(data)}
                  <div className="flex flex-wrap justify-center gap-6 mt-16">
                    {data.tags.map((tag, i) => (<span key={i} className="text-[12px] font-black uppercase tracking-[0.3em] text-black bg-orange-500 px-12 py-4 rounded-full shadow-2xl">{tag}</span>))}
                  </div>
               </div>
            </InfoCard>
            <InfoCard title="生涯故事 / CAREER STORY" onClick={() => openDetail('story', '生涯故事 / CAREER STORY')}><p className="text-zinc-300 leading-relaxed line-clamp-[12] text-2xl font-medium italic">{data.careerStory}</p></InfoCard>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Object.entries(data.totalStats).map(([key, val]) => val && (
                <InfoCard key={key} title="" onClick={() => {}} className="p-10 rounded-[2.5rem] text-center bg-zinc-950/50 hover:border-orange-500 cursor-default" showExpandIcon={false}><div className="text-zinc-800 text-[10px] font-black uppercase mb-3 tracking-[0.5em]">{key}</div><div className="text-orange-500 font-black text-xl uppercase italic tracking-tighter">{val}</div></InfoCard>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-12">
            <FeaturedMediaCard media={data.featuredMedia} onClick={() => openDetail('media', '核心作品分析 / PRODUCTION')} />
            <InfoCard title="核心代表作 / HIGHLIGHTS" onClick={() => openDetail('famous', '核心代表作 / HIGHLIGHTS')}>
              <div className="space-y-5">
                {data.famousWorks.map((f, i) => (
                  <a key={i} href={f.youtubeUrl} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center justify-between bg-black/60 p-6 rounded-3xl border border-orange-500/10 hover:border-orange-500 group transition-all shadow-2xl">
                    <span className="font-black text-sm text-zinc-400 group-hover:text-white truncate pr-6 uppercase italic">{f.title}</span>
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-2xl"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></div>
                  </a>
                ))}
              </div>
            </InfoCard>
            <InfoCard title="得獎紀錄 / AWARDS" onClick={() => openDetail('awards', '得獎紀錄 / AWARDS')}>{renderAwards(data.basicInfo.awards, false)}</InfoCard>
            <InfoCard title="生涯作品集 / WORKS" onClick={() => openDetail('works', '生涯作品集 / WORKS')}>{renderWorks(data.works, false)}</InfoCard>
          </div>
        </div>
      )}
      <DetailModal isOpen={!!selectedSection} onClose={closeDetail} title={selectedSection?.title || ''} content={getModalContent()} />
      <footer className="mt-40 pb-40 text-zinc-900 text-[12px] font-black tracking-[2.5em] uppercase text-center w-full border-t border-zinc-950 pt-60 italic relative z-10">STARPULSE AI // DATABASE v6.5</footer>
    </div>
  );
};
export default App;
