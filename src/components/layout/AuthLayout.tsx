import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const SLIDES = [
  {
    title: (
      <>
        Digitalizing <span className="text-[#3B82F6]">Traditional</span> <br />
        Community Savings.
      </>
    ),
    description: "Securely save, track, and grow your wealth with your trusted circles in one unified digital vault.",
    image: "/auth-rocket.png"
  },
  {
    title: (
      <>
        Automate Your <span className="text-[#3B82F6]">Contributions</span> <br />
        Effortlessly.
      </>
    ),
    description: "Never miss a payment with automated deductions and real-time payout tracking for your saving circles.",
    image: "/auth-automation.png"
  },
  {
    title: (
      <>
        Build Your <span className="text-[#3B82F6]">Financial</span> <br />
        Reputation.
      </>
    ),
    description: "Your consistent savings history helps you unlock better financial opportunities and credit limits.",
    image: "/auth-woman.png"
  }
];

const SLIDE_DURATION = 5000; // 5 seconds

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const interval = 50; // Update every 50ms for smooth animation
    const step = (interval / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => (curr + 1) % SLIDES.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* Left Panel - Illustration & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#102A56] p-16 flex-col justify-between overflow-hidden h-full">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Landing Page Style Blobs */}
          <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#3B82F6]/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-white/5 blur-[100px]" />

          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-[1px] border-white/5"
              style={{
                width: `${120 + i * 20}%`,
                height: `${120 + i * 20}%`,
                top: `${-20 - i * 5}%`,
                left: `${-30 - i * 5}%`,
              }}
            />
          ))}
        </div>

        {/* Logo at top */}
        <div className="relative z-20 mb-[-3rem] mt-[-2rem]">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6] shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight font-display">AjoVault</span>
          </div>
        </div>

        {/* Centered Content Wrapper */}
        <div className="flex-1 flex flex-col justify-center gap-10 relative z-10">
          {/* Carousel Content */}
          <div className="flex flex-col max-w-md">
            {/* Progress Bars (Time-out bars) */}
            <div className="flex gap-2 mb-8">
              {SLIDES.map((_, i) => (
                <div key={i} className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6]/80 transition-all duration-75 ease-linear"
                    style={{
                      width: i === currentSlide ? `${progress}%` : i < currentSlide ? '100%' : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-5"
              >
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight font-display">
                  {SLIDES[currentSlide].title}
                </h1>
                <p className="text-white/60 text-sm lg:text-base font-medium leading-relaxed">
                  {SLIDES[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Illustration - Now Centered */}
          <div className="relative flex justify-center items-center h-[40%] mt-[-1rem] mr-[2rem]">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ duration: 0.8 }}
                src={SLIDES[currentSlide].image}
                alt="Auth Illustration"
                className="h-full w-auto object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)]"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 md:p-12 lg:p-20 h-full overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6] shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#102A56] tracking-tight font-display">AjoVault</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
