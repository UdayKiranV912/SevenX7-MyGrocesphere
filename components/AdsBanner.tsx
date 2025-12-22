
import React from 'react';

const AdsBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-[32px] p-6 shadow-xl group border-2 border-white/10">
      {/* Decorative Background Orb */}
      <div className="absolute top-[-30%] right-[-10%] w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-colors duration-1000"></div>
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] shadow-lg">
            Ads Banner
          </span>
          <span className="text-[7px] text-white/40 font-black uppercase tracking-[0.1em]">
            Community Spotlight
          </span>
        </div>
        
        <div>
          <h3 className="text-white font-black text-2xl leading-none tracking-tight">
            SevenX7 Gold Plus
          </h3>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed">
            Early access to community harvests, zero handling fees, and prioritized delivery dispatch.
          </p>
        </div>
        
        <button className="w-full bg-white text-slate-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
          Explore Membership
        </button>
      </div>
    </div>
  );
};

export default AdsBanner;
