
import React from 'react';
import { AdCampaign } from '../types';

interface AdsBannerProps {
  ad: AdCampaign;
}

const AdsBanner: React.FC<AdsBannerProps> = ({ ad }) => {
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ad.websiteUrl) {
      window.open(ad.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      onClick={handleAction}
      className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 shadow-2xl group border border-white/10 transition-all duration-1000 hover:shadow-emerald-500/20 cursor-pointer active:scale-[0.98] isolate"
    >
      {/* Innovative Animated Background Components */}
      <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] group-hover:bg-emerald-400/20 transition-all duration-1000 animate-pulse"></div>
      <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] group-hover:bg-blue-400/15 transition-all duration-1000"></div>
      
      {/* Decorative Moving Tech Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      
      {/* Animated Floating Particles (Simulated with div elements) */}
      <div className="absolute top-10 right-20 w-1 h-1 bg-white rounded-full animate-float opacity-20"></div>
      <div className="absolute bottom-20 left-10 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-float opacity-30 delay-700"></div>
      
      {/* Dynamic Glowing Edge Gradient */}
      <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-br from-emerald-500/30 via-transparent to-white/10 rounded-[3rem] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

      <div className="relative z-10 flex flex-col gap-8">
        {/* Top Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-xl">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{ad.tag || 'Verified Partner'}</span>
            </div>
          </div>
          <div className="text-[10px] font-black text-emerald-400/40 uppercase tracking-[0.5em] border border-emerald-500/10 px-4 py-1 rounded-2xl">
            Spotlight
          </div>
        </div>
        
        {/* Central Visionary Branding Area */}
        <div className="flex gap-7 items-start">
          <div className="relative shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/20 via-slate-800 to-blue-500/20 rounded-[32px] flex items-center justify-center text-5xl border border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">
                <span className="filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)] transform group-hover:scale-125 transition-transform duration-500">
                  {ad.icon || '🚀'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              {/* Technical detail elements */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-2xl text-xs animate-bounce-soft">✨</div>
          </div>
          
          <div className="flex-1 space-y-3 pt-2">
            <div className="flex flex-col">
              <h3 className="text-white font-black text-4xl leading-none tracking-tighter group-hover:translate-x-1 transition-transform duration-500">
                {ad.partnerName}
              </h3>
              {ad.partnerSuffix && (
                <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.5em] mt-2 opacity-80 leading-none">
                  {ad.partnerSuffix}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[95%] opacity-60 group-hover:opacity-100 transition-all duration-500">
              {ad.description}
            </p>
          </div>
        </div>
        
        {/* Innovative Call-to-Action */}
        <div className="space-y-5">
          <button 
            onClick={handleAction}
            className="group/btn w-full bg-white text-slate-900 h-16 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_-10px_rgba(255,255,255,0.15)] active:scale-[0.97] transition-all flex items-center justify-center gap-4 hover:bg-emerald-50 relative overflow-hidden"
          >
            <span className="relative z-10 transition-transform group-hover/btn:scale-105">{ad.ctaText}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 opacity-40 group-hover/btn:translate-x-1.5 group-hover/btn:-translate-y-1.5 transition-all duration-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-700"></div>
          </button>

          <div className="flex items-center justify-center gap-6">
            <span className="h-[1px] flex-1 bg-white/5"></span>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] group-hover:text-emerald-400/40 transition-colors">
              {ad.displayUrl}
            </p>
            <span className="h-[1px] flex-1 bg-white/5"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsBanner;
