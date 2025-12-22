
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

  const isSevenX7 = ad.partnerName.toLowerCase().includes('seven');

  return (
    <div 
      onClick={handleAction}
      className="relative overflow-hidden bg-[#0a0a0b] rounded-[40px] p-8 shadow-2xl group border border-white/5 transition-all duration-1000 hover:shadow-emerald-500/20 cursor-pointer active:scale-[0.98]"
    >
      {/* Innovative Animated Background Elements */}
      <div className="absolute top-[-40%] right-[-20%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] group-hover:bg-emerald-400/20 transition-all duration-1000 animate-pulse"></div>
      <div className="absolute bottom-[-30%] left-[-10%] w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] group-hover:bg-blue-400/15 transition-all duration-1000"></div>
      
      {/* Decorative Moving Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      
      {/* Animated Glowing Edge */}
      <div className="absolute inset-0 border-[1.5px] border-transparent bg-gradient-to-br from-emerald-500/30 via-transparent to-blue-500/30 rounded-[40px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="relative z-10 flex flex-col gap-8">
        {/* Top Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-xl">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-[8px] font-black text-white uppercase tracking-[0.25em]">Verified Partner</span>
            </div>
          </div>
          <div className="text-[9px] font-black text-emerald-400/40 uppercase tracking-[0.4em] border border-emerald-500/10 px-3 py-1 rounded-xl">
            Spotlight
          </div>
        </div>
        
        {/* Central Brand & Description Area */}
        <div className="flex gap-6 items-start">
          <div className="relative shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-[32px] flex items-center justify-center text-5xl border border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                <span className="filter drop-shadow-lg">{ad.icon || '🚀'}</span>
              </div>
              {/* Floating tech elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-[10px] animate-bounce-soft">✨</div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex flex-col">
              <h3 className="text-white font-black text-4xl leading-none tracking-tighter group-hover:translate-x-1 transition-transform duration-500">
                {ad.partnerName}
              </h3>
              {ad.partnerSuffix && (
                <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.4em] mt-1 opacity-80">
                  {ad.partnerSuffix}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[90%] opacity-70 group-hover:opacity-100 transition-opacity duration-500">
              {ad.description}
            </p>
          </div>
        </div>
        
        {/* Innovative CTA Section */}
        <div className="space-y-4">
          <button 
            onClick={handleAction}
            className="group/btn w-full bg-white text-slate-900 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 hover:bg-emerald-50 relative overflow-hidden"
          >
            <span className="relative z-10">{ad.ctaText}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-40 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
          </button>

          <div className="flex items-center justify-center gap-4">
            <span className="h-px flex-1 bg-white/5"></span>
            <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.5em] group-hover:text-emerald-400/40 transition-colors">
              {ad.displayUrl}
            </p>
            <span className="h-px flex-1 bg-white/5"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsBanner;
