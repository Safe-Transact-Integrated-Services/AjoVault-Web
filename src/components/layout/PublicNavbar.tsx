import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import ContactModal from '@/components/ContactModal';

const featureMenuItems = [
  { name: 'Rotating group contributions', href: '/circles' },
  { name: 'Personal goals', href: '/savings' },
  { name: 'Group goals', href: '/group-goals' },
  { name: 'Fundraising', href: '/fundraising' },
];

const navLinks = [
  {
    name: 'FEATURES',
    href: '#features',
    submenu: featureMenuItems,
  },
  {
    name: 'PLATFORM',
    href: '#',
    submenu: [
      { name: 'Agent', href: '/agent/apply' },
      { name: 'Individual', href: '/signup' },
    ],
  },
  { name: 'SERVICES', href: '/#services' },
  { name: 'ABOUT US', href: 'https://www.safetransact.ng/' },
  { name: 'CONTACT US', href: '#contact-us' },
];

const PublicNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const isFundraisingPage = location.pathname.startsWith('/fundraising');

  const handleGoTo = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path.startsWith('/')) {
      navigate(path);
    } else if (path.startsWith('http')) {
      window.open(path, '_blank');
    } else {
      navigate('/' + path);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#102A56] py-3.5 shadow-md border-b border-white/10 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="relative z-10 flex items-center"
          >
            <img src="/logo.png" alt="AjoVault Logo" className="h-14 w-auto brightness-0 invert" />
          </a>

          {/* Hide navigation links on fundraising page */}
          {!isFundraisingPage && (
            <nav className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <div key={link.name} className="group relative">
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (link.name === 'CONTACT US') {
                        e.preventDefault();
                        setIsContactModalOpen(true);
                      } else if (link.href.startsWith('/')) {
                        e.preventDefault();
                        navigate(link.href);
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] font-black text-white/75 transition-colors hover:text-[#3B82F6]"
                  >
                    {link.name}
                    {link.submenu && <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />}
                  </a>

                  {link.submenu && (
                    <div className="invisible absolute left-1/2 top-full mt-3 w-52 -translate-x-1/2 translate-y-2 rounded-lg border border-white/10 bg-[#102A56] py-3 opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {link.submenu.map((sub) => (
                        <a
                          key={sub.name}
                          href={sub.href}
                          onClick={(e) => {
                            e.preventDefault();
                            handleGoTo(sub.href);
                          }}
                          className="block px-5 py-2 text-[11px] font-bold text-white/70 transition-colors hover:bg-white/5 hover:text-[#3B82F6]"
                        >
                          {sub.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: location } })}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-black uppercase text-white transition-all hover:bg-white/10 active:scale-95"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#3B82F6] px-6 py-2.5 text-[10px] font-black uppercase text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:scale-105 active:scale-95"
            >
              Sign Up Now
            </button>
            {!isFundraisingPage && (
              <button
                type="button"
                aria-label="Open navigation menu"
                className="p-2 text-2xl text-white transition-transform active:scale-95 lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {!isFundraisingPage && (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-[#08152b]/80 backdrop-blur-md transition-all duration-300 lg:hidden ${
              isMobileMenuOpen ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside
            className={`fixed right-0 top-0 z-[70] h-screen w-[320px] max-w-[86vw] border-l border-white/10 bg-[#102A56] shadow-2xl transition-transform duration-500 lg:hidden ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/5 p-6">
                <div className="flex items-center">
                  <img src="/logo.png" alt="AjoVault Logo" className="h-12 w-auto brightness-0 invert" />
                </div>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="rounded-lg p-2 text-2xl text-white transition-colors hover:bg-white/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                {navLinks.map((link) => (
                  <div key={link.name} className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-between text-left"
                      onClick={() => {
                        if (link.submenu) {
                          setMobileDropdown(mobileDropdown === link.name ? null : link.name);
                          return;
                        }
                        if (link.name === 'CONTACT US') {
                          setIsMobileMenuOpen(false);
                          setIsContactModalOpen(true);
                          return;
                        }
                        handleGoTo(link.href);
                      }}
                    >
                      <span className="text-base font-bold text-white/80">{link.name}</span>
                      {link.submenu && (
                        <ChevronDown
                          className={`h-4 w-4 text-white/50 transition-transform ${
                            mobileDropdown === link.name ? 'rotate-180 text-[#3B82F6]' : ''
                          }`}
                        />
                      )}
                    </button>

                    {link.submenu && (
                      <div
                        className={`flex flex-col gap-2 overflow-hidden border-l-2 border-blue-400/25 pl-4 transition-all duration-300 ${
                          mobileDropdown === link.name ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        {link.submenu.map((sub) => (
                          <a
                            key={sub.name}
                            href={sub.href}
                            onClick={(e) => {
                              e.preventDefault();
                              handleGoTo(sub.href);
                            }}
                            className="py-1 text-xs font-bold text-white/60 transition-colors hover:text-[#3B82F6]"
                          >
                            {sub.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex flex-col gap-3 border-t border-white/5 p-6">
                <button
                  type="button"
                  onClick={() => handleGoTo('/login')}
                  className="flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 py-3 text-xs font-black uppercase text-white transition-all hover:bg-white/10"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleGoTo('/signup')}
                  className="flex w-full items-center justify-center rounded-full bg-[#3B82F6] py-3 text-xs font-black uppercase text-white shadow-lg hover:bg-blue-600"
                >
                  Sign Up Now
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  );
};

export default PublicNavbar;
