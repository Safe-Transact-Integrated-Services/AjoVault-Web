import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  EyeOff,
  Heart,
  Instagram,
  KeyRound,
  Lightbulb,
  Linkedin,
  LockKeyhole,
  Mail,
  Megaphone,
  Menu,
  Presentation,
  Settings,
  ShieldCheck,
  Smartphone,
  Twitter,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

type NavLink = {
  name: string;
  href: string;
  submenu?: Array<{ name: string; href: string }>;
};

type IconCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const navLinks: NavLink[] = [
  {
    name: 'FEATURES',
    href: '#features',
    submenu: [
      { name: 'Join Circle', href: '#features' },
      { name: 'Fundraising', href: '#features' },
      { name: 'Group Savings', href: '#features' },
    ],
  },
  {
    name: 'HOW IT WORKS',
    href: '#how-it-works',
    submenu: [{ name: 'Become an Agent', href: '#how-it-works' }],
  },
  { name: 'SERVICES', href: '#services' },
  { name: 'ABOUT US', href: '#about-us' },
  { name: 'CONTACT US', href: '#contact-us' },
];

const featurePairs = [
  {
    problemTitle: 'Manual Record Keeping',
    problemDescription: 'Outdated systems lead to errors and disputes. Tracking contributions by hand is risky and inefficient.',
    solutionTitle: 'Automated Ledger',
    solutionDescription: 'AjoVault automates contribution records with digital precision, so every payment and payout is tracked.',
    problemIcon: BookOpen,
    solutionIcon: ClipboardList,
  },
  {
    problemTitle: 'Limited Transparency',
    problemDescription: 'Members often lack visibility into group savings, creating mistrust and communication gaps.',
    solutionTitle: 'Real-Time Visibility',
    solutionDescription: 'Members can see contributions, payouts, and group standing directly from their dashboard.',
    problemIcon: EyeOff,
    solutionIcon: Presentation,
  },
  {
    problemTitle: 'No Credit History',
    problemDescription: "Traditional savings do not usually help members build formal financial history.",
    solutionTitle: 'Credit Passport',
    solutionDescription: 'Consistent savings activity can support a stronger financial profile over time.',
    problemIcon: LockKeyhole,
    solutionIcon: BarChart3,
  },
];

const trustBenefits: IconCard[] = [
  {
    title: 'Secure & Transparent',
    description: 'Every transaction is encrypted and recorded with a clear trail for members.',
    icon: ShieldCheck,
  },
  {
    title: 'Built for Communities',
    description: 'Designed for Ajo, Esusu, cooperatives, and group contribution culture.',
    icon: Users,
  },
  {
    title: 'Modernized Logistics',
    description: 'No more manual collections. Fund wallets, automate contributions, and track payouts.',
    icon: CreditCard,
  },
  {
    title: 'Trust and Compliance',
    description: 'AjoVault is built with security-first flows and clear approval controls.',
    icon: BadgeCheck,
  },
];

const howItWorks = [
  {
    title: 'Create Your Account',
    description: 'Set up your profile and get access to the AjoVault wallet and savings tools.',
    icon: UserPlus,
  },
  {
    title: 'Set Savings Plan',
    description: 'Join an existing circle or create your own plan with custom contribution rules.',
    icon: Settings,
  },
  {
    title: 'Invite Your Community',
    description: 'Bring trusted members into a group goal, circle, cooperative, or campaign.',
    icon: Users,
  },
  {
    title: 'Receive Funds & Grow',
    description: 'Track payouts, build financial history, and keep your community moving.',
    icon: CircleDollarSign,
  },
];

const services: IconCard[] = [
  {
    title: 'Smart Personal Savings',
    description: 'Set financial goals, save consistently, and manage your money with ease.',
    icon: UserPlus,
  },
  {
    title: 'Group & Cooperative Savings',
    description: 'Create groups, onboard members, and track contributions transparently.',
    icon: Users,
  },
  {
    title: 'Credit & Loan Access',
    description: 'Access structured credit with clear eligibility rules and repayment visibility.',
    icon: Banknote,
  },
  {
    title: 'Wallet & Transactions',
    description: 'Fund your wallet, transfer money, withdraw funds, and pay bills securely.',
    icon: Wallet,
  },
  {
    title: 'Fundraising Campaigns',
    description: 'Launch personal or community fundraising goals with transparent tracking.',
    icon: Megaphone,
  },
  {
    title: 'Admin & Insights',
    description: 'Manage programs, set rules, and review operational reports in real time.',
    icon: BarChart3,
  },
];

const communityItems: IconCard[] = [
  {
    title: 'Tailored for Ajo/Esusu',
    description: 'Designed specifically for traditional social saving models.',
    icon: Smartphone,
  },
  {
    title: 'Flexible Funding',
    description: 'Multiple ways to fund contributions and receive payouts.',
    icon: Zap,
  },
  {
    title: 'Community & Savings',
    description: 'Strengthen bonds while growing financial potential.',
    icon: Heart,
  },
  {
    title: 'Growth and Inclusion',
    description: 'Build a future, not just a pot of money.',
    icon: Lightbulb,
  },
];

const securityCards: IconCard[] = [
  {
    title: 'Bank-Grade Security',
    description: 'Funds and account actions are protected by layered controls and encrypted flows.',
    icon: LockKeyhole,
  },
  {
    title: 'Full Compliance',
    description: 'Approval, audit, and identity workflows are built into the platform experience.',
    icon: ShieldCheck,
  },
  {
    title: 'Data Privacy',
    description: 'Sensitive actions are handled with secure API rules and session protections.',
    icon: KeyRound,
  },
];

const Welcome = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 48);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goTo = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const handleWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWaitlistMessage(`${email.trim()} has been added to the early access list.`);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#102A56]/95 py-3 shadow-lg backdrop-blur-md' : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a href="#hero" className="relative z-10 flex items-center gap-2">
            <span className="rounded-lg bg-[#3B82F6] p-1.5 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-5 w-5 text-white lg:h-6 lg:w-6" />
            </span>
            <span className="font-display text-xl font-bold text-white lg:text-2xl">AjoVault</span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map(link => (
              <div key={link.name} className="group relative">
                <a
                  href={link.href}
                  className="flex items-center gap-1 text-[10px] font-black text-white/75 transition-colors hover:text-[#3B82F6]"
                >
                  {link.name}
                  {link.submenu && <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />}
                </a>

                {link.submenu && (
                  <div className="invisible absolute left-1/2 top-full mt-4 w-48 -translate-x-1/2 translate-y-2 rounded-lg border border-white/10 bg-[#102A56] py-4 opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {link.submenu.map(sub => (
                      <a
                        key={sub.name}
                        href={sub.href}
                        className="block px-6 py-2 text-[10px] font-bold text-white/70 transition-colors hover:bg-white/5 hover:text-[#3B82F6]"
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => goTo('/signup')}
              className="hidden rounded-full bg-[#3B82F6] px-7 py-3 text-[10px] font-black uppercase text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 lg:block"
            >
              Sign Up Now
            </button>
            <button
              type="button"
              aria-label="Open navigation menu"
              className="p-2 text-3xl text-white transition-transform active:scale-95 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>

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
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#3B82F6] p-1.5">
                <ShieldCheck className="h-5 w-5 text-white" />
              </span>
              <span className="font-display text-xl font-bold text-white">AjoVault</span>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="rounded-lg p-2 text-3xl text-white transition-colors hover:bg-white/5"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-7 overflow-y-auto p-8">
            {navLinks.map(link => (
              <div key={link.name} className="flex flex-col gap-4">
                <button
                  type="button"
                  className="flex items-center justify-between text-left"
                  onClick={() => {
                    if (link.submenu) {
                      setMobileDropdown(mobileDropdown === link.name ? null : link.name);
                      return;
                    }

                    window.location.hash = link.href;
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="text-lg font-bold text-white/80">{link.name}</span>
                  {link.submenu && (
                    <ChevronDown
                      className={`h-5 w-5 text-white/50 transition-transform ${
                        mobileDropdown === link.name ? 'rotate-180 text-[#3B82F6]' : ''
                      }`}
                    />
                  )}
                </button>

                {link.submenu && (
                  <div
                    className={`flex flex-col gap-3 overflow-hidden border-l-2 border-blue-400/25 pl-4 transition-all duration-300 ${
                      mobileDropdown === link.name ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {link.submenu.map(sub => (
                      <a
                        key={sub.name}
                        href={sub.href}
                        className="py-1 text-sm font-bold text-white/55 transition-colors hover:text-[#3B82F6]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="border-t border-white/5 p-8">
            <button
              type="button"
              onClick={() => goTo('/signup')}
              className="flex w-full items-center justify-center rounded-full bg-[#3B82F6] py-4 text-sm font-black uppercase text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-95"
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </aside>

      <main>
        <section id="hero" className="relative flex min-h-screen items-center overflow-hidden bg-[#102A56] pb-24 pt-32">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-white/5 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase text-[#3B82F6]">
                  <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                  Launching Soon - Join the Movement
                </div>

                <h1 className="mb-8 font-display text-5xl font-black leading-none text-white sm:text-6xl lg:text-8xl">
                  Digitizing <br />
                  <span className="text-[#3B82F6]">Community</span> <br />
                  Savings.
                </h1>

                <p className="mb-10 max-w-xl text-lg font-medium leading-relaxed text-white/70 sm:text-xl">
                  AjoVault brings trust and efficiency to traditional community savings.
                  Automate contributions, track payouts in real time, and build a stronger
                  financial profile while you save.
                </p>

                <div className="mb-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => goTo('/signup')}
                    className="inline-flex items-center justify-center rounded-full bg-[#3B82F6] px-8 py-4 text-sm font-black uppercase text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-600 hover:scale-105 active:scale-95"
                  >
                    Create Account <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo('/login')}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase text-white transition-all hover:bg-white/10 active:scale-95"
                  >
                    Sign In
                  </button>
                </div>

                <form onSubmit={handleWaitlist} className="max-w-md">
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 h-5 w-5 text-white/40" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      required
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      className="h-14 w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-36 text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-400/60"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 rounded-full bg-[#3B82F6] px-5 py-3 text-xs font-black uppercase text-white transition-all hover:bg-blue-600"
                    >
                      Join
                    </button>
                  </div>
                  <p className="mt-3 px-4 text-[11px] text-white/35">
                    {waitlistMessage || 'Be first to know when we launch and get early access benefits.'}
                  </p>
                </form>
              </div>

              <div className="relative">
                <div className="relative z-10 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
                  <img
                    src="/ajovault_isometric_dashboard_blue_1776872371844.png"
                    alt="AjoVault isometric dashboard"
                    className="h-auto w-full scale-105 rounded-lg shadow-2xl"
                  />
                </div>

                <div className="absolute -top-10 right-4 z-20 hidden rounded-lg border border-white/10 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md md:block">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                      <CheckCircle2 className="h-7 w-7 text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white/40">Group Payout</p>
                      <p className="font-display text-lg font-black text-white">NGN 4,250,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-24 bg-[#F8FAFC]"
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 80%)' }}
          />
        </section>

        <section id="features" className="bg-white py-24 scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionIntro
              eyebrow="The Solution"
              title={
                <>
                  Bridging the Gap Between <span className="text-[#3B82F6]">Tradition</span> &{' '}
                  <span className="text-[#3B82F6]">Tech</span>
                </>
              }
              description="We identified core flaws in traditional savings and built the digital infrastructure to make contribution groups more transparent."
            />

            <div className="space-y-10">
              {featurePairs.map(pair => (
                <div key={pair.problemTitle} className="grid items-stretch gap-6 lg:grid-cols-2">
                  <InfoPanel
                    label="The Problem"
                    title={pair.problemTitle}
                    description={pair.problemDescription}
                    icon={pair.problemIcon}
                    tone="light"
                  />
                  <InfoPanel
                    label="The Solution"
                    title={pair.solutionTitle}
                    description={pair.solutionDescription}
                    icon={pair.solutionIcon}
                    tone="dark"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F9FBFA] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionIntro
              title={
                <>
                  AjoVault Brings <span className="text-emerald-600">Trust to Digital Finance</span>
                </>
              }
              description="Our platform combines traditional wisdom with modern technology to create a safer saving environment."
            />

            <div className="grid gap-6 md:grid-cols-2">
              {trustBenefits.map(benefit => (
                <BenefitCard key={benefit.title} {...benefit} />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative overflow-hidden bg-white py-24 scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionIntro
              eyebrow="Process"
              title="HOW IT WORKS"
              description="Simple steps to digitize your community savings experience."
            />

            <div className="relative">
              <div className="absolute left-0 right-0 top-12 hidden h-px bg-blue-500/20 lg:block" />
              <div className="grid gap-12 text-center lg:grid-cols-4">
                {howItWorks.map((step, index) => (
                  <div key={step.title} className="relative flex flex-col items-center">
                    <div className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-[#102A56] text-white shadow-2xl">
                      <step.icon className="h-10 w-10" />
                      <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#3B82F6] text-sm font-black text-white shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="mb-4 font-display text-2xl font-black text-[#102A56]">{step.title}</h3>
                    <p className="max-w-[220px] text-sm font-medium leading-relaxed text-slate-500">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="relative bg-white py-24 scroll-mt-24">
          <div className="absolute inset-0 bg-[#F0F7FF]/30" />
          <div className="relative mx-auto max-w-7xl px-6">
            <SectionIntro
              eyebrow="What We Offer"
              title="OUR SERVICES"
              description="Everything you need to manage your finances, alone or with your community."
            />

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
          </div>
        </section>

        <section id="about-us" className="bg-white py-24 scroll-mt-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-6 font-display text-4xl font-black text-[#102A56]">ABOUT US</h2>
            <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
              AjoVault is on a mission to bring financial inclusion to millions by digitizing trusted community
              savings models. We believe in the power of collective growth and community-driven finance.
            </p>
          </div>
        </section>

        <section className="overflow-hidden bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionIntro
              eyebrow="For The People"
              title={
                <>
                  Built for <span className="text-emerald-600">Real Communities</span>
                </>
              }
              description="Empowering traditional savings with modern reliability."
            />

            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="relative">
                <div className="relative z-10 overflow-hidden rounded-lg shadow-2xl">
                  <img
                    src="/ajovault_community_usage_1776691299674.png"
                    alt="Community using AjoVault"
                    className="h-auto w-full"
                  />
                </div>
                <div className="absolute -bottom-6 -right-4 z-20 flex items-center gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-xl sm:-right-6">
                  <div className="flex -space-x-2">
                    <span className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                    <span className="h-8 w-8 rounded-full border-2 border-white bg-slate-100" />
                    <span className="h-8 w-8 rounded-full border-2 border-white bg-slate-50" />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-[#102A56]">50+ Communities</p>
                    <p className="text-slate-400">Joined this week</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {communityItems.map(item => (
                  <div key={item.title} className="group flex items-start gap-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-[#102A56] shadow-sm transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold text-[#102A56]">{item.title}</h3>
                      <p className="max-w-md leading-relaxed text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="bg-[#102A56] py-24 text-white scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionIntro
              eyebrow="Safety First"
              title={
                <>
                  COMPLIANCE AND <span className="text-[#3B82F6]">SECURITY</span>
                </>
              }
              description="Your funds are protected by secure infrastructure, monitored actions, and careful account controls."
              inverted
            />

            <div className="grid gap-8 text-center md:grid-cols-3">
              {securityCards.map(card => (
                <div key={card.title} className="rounded-lg border border-white/10 bg-white/5 p-10 transition-all hover:-translate-y-2 hover:bg-white/10">
                  <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-lg bg-[#3B82F6] text-white shadow-xl shadow-blue-500/20">
                    <card.icon className="h-10 w-10" />
                  </div>
                  <h3 className="mb-4 font-display text-2xl font-black">{card.title}</h3>
                  <p className="font-medium leading-relaxed text-white/45">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact-us" className="bg-slate-50 py-24 scroll-mt-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-6 font-display text-4xl font-black text-[#102A56]">CONTACT US</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
              Have questions or want to partner with us? Reach out and our team will get back to you shortly.
            </p>
            <a
              href="mailto:hello@ajovault.ng"
              className="inline-flex items-center rounded-full bg-[#102A56] px-8 py-4 text-sm font-black uppercase text-white transition-all hover:bg-[#3B82F6]"
            >
              <Mail className="mr-2 h-4 w-4" />
              hello@ajovault.ng
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-[#102A56] pb-12 pt-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative mb-20 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-10 text-center lg:p-16">
            <h2 className="mb-8 font-display text-4xl font-black lg:text-6xl">
              Your Community. <span className="text-[#3B82F6] underline decoration-blue-500/20">Your Savings.</span>
              <br />
              Secured.
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-white/60">
              Join users who are digitizing community savings and building stronger financial futures.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => goTo('/signup')}
                className="rounded-full bg-[#3B82F6] px-10 py-4 font-black uppercase text-white shadow-xl shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95"
              >
                Sign Up Now
              </button>
              <a
                href="#features"
                className="rounded-full border border-white/20 px-10 py-4 font-black uppercase text-white transition-all hover:bg-white/5"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="mb-12 grid gap-12 border-b border-white/10 pb-12 md:grid-cols-4">
            <div>
              <div className="mb-6 flex items-center gap-2">
                <span className="rounded-lg bg-[#3B82F6] p-1.5 shadow-lg shadow-blue-500/20">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </span>
                <span className="font-display text-2xl font-black text-white">AjoVault</span>
              </div>
              <p className="mb-6 max-w-xs font-medium leading-relaxed text-white/50">
                Digitizing community savings and empowering financial freedom for every circle.
              </p>
              <div className="flex gap-3">
                {[Twitter, Instagram, Linkedin, Mail].map((Icon, index) => (
                  <a
                    key={index}
                    href={index === 3 ? 'mailto:hello@ajovault.ng' : '#'}
                    aria-label={index === 3 ? 'Email AjoVault' : 'AjoVault social link'}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:bg-[#3B82F6]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            <FooterLinks title="The Company" links={['About Us', 'Features', 'How It Works', 'Contact Us']} />
            <FooterLinks title="Product" links={['Features', 'How It Works', 'Security', 'Get Started']} />
            <FooterLinks title="Resources" links={['Help Center', 'Safety Guide', 'Community Rules', 'Privacy']} />
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-[10px] font-bold uppercase text-white/25 md:flex-row">
            <p>Copyright 2026 safe transact integrated services ltd. All rights reserved.</p>
            <p>Built by the AjoVault Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SectionIntro = ({
  eyebrow,
  title,
  description,
  inverted = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  inverted?: boolean;
}) => (
  <div className="mx-auto mb-16 max-w-3xl text-center">
    {eyebrow && (
      <p className={`mb-4 text-sm font-black uppercase ${inverted ? 'text-[#3B82F6]' : 'text-[#3B82F6]'}`}>
        {eyebrow}
      </p>
    )}
    <h2 className={`mb-6 font-display text-4xl font-black lg:text-6xl ${inverted ? 'text-white' : 'text-[#102A56]'}`}>
      {title}
    </h2>
    {description && (
      <p className={`mx-auto max-w-2xl text-lg font-medium leading-relaxed ${inverted ? 'text-white/60' : 'text-slate-500'}`}>
        {description}
      </p>
    )}
  </div>
);

const InfoPanel = ({
  label,
  title,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'light' | 'dark';
}) => {
  const isDark = tone === 'dark';

  return (
    <div className={`relative overflow-hidden rounded-lg p-8 lg:p-12 ${isDark ? 'bg-[#102A56] text-white' : 'border border-slate-100 bg-slate-50'}`}>
      <Icon className={`absolute right-8 top-8 h-16 w-16 ${isDark ? 'text-white/10' : 'text-slate-200'}`} />
      <div className="relative z-10">
        <p className={`mb-4 text-sm font-bold uppercase ${isDark ? 'text-[#3B82F6]' : 'text-slate-400'}`}>{label}</p>
        <h3 className={`mb-4 font-display text-2xl font-black ${isDark ? 'text-white' : 'text-[#102A56]'}`}>{title}</h3>
        <p className={`max-w-sm leading-relaxed ${isDark ? 'text-white/65' : 'text-slate-500'}`}>{description}</p>
      </div>
    </div>
  );
};

const BenefitCard = ({ title, description, icon: Icon }: IconCard) => (
  <div className="flex items-center gap-6 rounded-lg border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-900/5">
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
      <Icon className="h-8 w-8" />
    </div>
    <div>
      <h3 className="mb-2 text-xl font-bold text-[#102A56]">{title}</h3>
      <p className="leading-relaxed text-slate-600">{description}</p>
    </div>
  </div>
);

const ServiceCard = ({ title, description, icon: Icon }: IconCard) => (
  <div className="group flex flex-col items-center rounded-lg border border-slate-100 bg-white p-10 text-center transition-all hover:shadow-2xl hover:shadow-blue-900/5">
    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-lg bg-[#F0F7FF] text-[#102A56] shadow-sm transition-all group-hover:bg-[#3B82F6] group-hover:text-white">
      <Icon className="h-10 w-10" />
    </div>
    <h3 className="mb-4 font-display text-2xl font-black text-[#102A56]">{title}</h3>
    <p className="font-medium leading-relaxed text-slate-500">{description}</p>
  </div>
);

const FooterLinks = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <h3 className="mb-6 text-xs font-black uppercase text-[#3B82F6]">{title}</h3>
    <ul className="space-y-4 text-sm font-bold uppercase text-white/45">
      {links.map(link => {
        const href = link === 'Get Started'
          ? '/signup'
          : `#${link.toLowerCase().replace(/\s+/g, '-').replace('get-started', 'hero')}`;

        return (
          <li key={link}>
            <a href={href} className="transition-colors hover:text-white">
              {link}
            </a>
          </li>
        );
      })}
    </ul>
  </div>
);

export default Welcome;
