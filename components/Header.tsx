import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SevenX7Logo from './SevenX7Logo';
import { useLanguage } from '../contexts/LanguageContext';

const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void; delay?: string }> = ({ to, children, onClick, delay }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/apps' && location.pathname.startsWith('/apps/'));
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative group text-4xl md:text-sm font-bold md:font-medium transition-all duration-300 ${
        isActive ? 'text-white' : 'text-slate-500 hover:text-white'
      }`}
      style={{ transitionDelay: delay }}
    >
      <span className="relative z-10">{children}</span>
      <span className={`absolute -bottom-2 left-0 w-full h-0.5 bg-secondary transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
    </Link>
  );
};

interface HeaderProps {
  onNewsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewsClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  // Scroll Handler with Throttling optimization
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Body Scroll Lock logic
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevent pull-to-refresh on mobile when menu open
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/apps', label: 'Apps' },
    { path: '/about', label: 'Works' },
    { path: '/careers', label: 'Careers' },
    { path: '/dashboard', label: 'Analytics' },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-[60] transition-all duration-500 border-b ${
          scrolled || isOpen
            ? 'bg-[#050505]/80 backdrop-blur-xl border-white/5 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex-shrink-0 relative z-[70]">
              <Link to="/" className="flex items-center group" onClick={() => setIsOpen(false)}>
                <SevenX7Logo onNewsClick={onNewsClick} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <nav className="flex items-center space-x-8">
                {navItems.map((item) => (
                  <NavLink key={item.path} to={item.path}>{t(item.label)}</NavLink>
                ))}
              </nav>
              
              <div className="h-6 w-px bg-slate-800"></div>

              {/* Desktop CTA */}
              <Link 
                to="/register" 
                className="group relative px-6 py-2.5 rounded-full overflow-hidden bg-white text-black font-bold text-sm transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                <div className="absolute inset-0 bg-secondary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10 group-hover:text-black transition-colors">{t('Get Started')}</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden relative z-[70]">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95 transition-all"
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-1.5 items-end">
                  <span 
                    className={`block h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-6 rotate-45 translate-y-2 bg-secondary' : 'w-6'}`} 
                  />
                  <span 
                    className={`block h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-0 opacity-0' : 'w-4'}`} 
                  />
                  <span 
                    className={`block h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-6 -rotate-45 -translate-y-2 bg-secondary' : 'w-5'}`} 
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-3xl md:hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-200'
        }`}
        style={{ height: '100dvh' }} // Use dynamic viewport height
      >
        {/* Animated Background Orbs */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="flex flex-col h-full pt-28 pb-10 px-6 overflow-y-auto">
          <nav className="flex-1 flex flex-col space-y-2">
            {navItems.map((item, index) => (
              <div 
                key={item.path}
                className={`transform transition-all duration-500 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <Link 
                  to={item.path} 
                  onClick={() => setIsOpen(false)}
                  className={`block py-3 text-5xl font-black tracking-tight transition-colors ${
                    location.pathname === item.path ? 'text-secondary' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {t(item.label)}
                </Link>
              </div>
            ))}
          </nav>

          <div 
            className={`mt-auto pt-8 border-t border-white/10 transform transition-all duration-700 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '300ms' }}
          >
             <Link 
              to="/register"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-8 py-5 bg-white text-black font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 transition-transform"
             >
               <span>{t('Join Now')}</span>
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
             </Link>

             <div className="mt-8 flex justify-between text-xs font-mono text-slate-500 uppercase tracking-widest">
                <span>© 2025 SevenX7 Innovations</span>
                <span>Bengaluru, IN</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;