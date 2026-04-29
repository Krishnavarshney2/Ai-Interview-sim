'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';

// Scroll Reveal Hook
function useReveal(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
}

// Animated Counter Component
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const stepTime = Math.abs(Math.floor(duration / target));
    const timer = setInterval(() => {
      start += Math.ceil(target / (duration / stepTime));
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// 3D Tilt Card Component
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ transform, transition: 'transform 0.2s ease-out' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [orbOffset, setOrbOffset] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const revealRef1 = useRef<HTMLDivElement>(null);
  const revealRef2 = useRef<HTMLDivElement>(null);
  const revealRef3 = useRef<HTMLDivElement>(null);
  const revealRef4 = useRef<HTMLDivElement>(null);

  useReveal(revealRef1);
  useReveal(revealRef2);
  useReveal(revealRef3);
  useReveal(revealRef4);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setOrbOffset(window.scrollY * 0.3);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typing animation
  useEffect(() => {
    const fullText = 'Ethereal Intelligence';
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Logo - Top Left */}
      <div className={`fixed top-6 left-6 z-50 flex items-center gap-3 transition-all duration-500 ${
        isScrolled ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-on-primary text-xl">smart_toy</span>
        </div>
        <span className="font-headline text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Luminal AI
        </span>
      </div>

      {/* Sign In / Get Started - Top Right Corner */}
      <div className="fixed top-0 right-0 z-50">
        <div className="flex items-center gap-3 m-4">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 rounded-xl text-primary font-label font-bold glass-panel hover:bg-surface-container-high transition-all text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2.5 rounded-xl text-on-primary font-label font-bold bipolar-gradient hover:scale-105 active:scale-95 transition-all text-sm shadow-[0_0_20px_rgba(175,198,255,0.2)]"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <header ref={heroRef} className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20 overflow-hidden">
        {/* Background Orbs with Parallax */}
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary orb-glow rounded-full transition-transform duration-100"
          style={{ transform: `translateY(${orbOffset * 0.5}px)` }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary orb-glow rounded-full transition-transform duration-100"
          style={{ transform: `translateY(${orbOffset * -0.3}px)` }}
        ></div>

        <div className="relative z-10 max-w-5xl text-center space-y-8">
          <div className="inline-block py-1 px-4 rounded-full bg-surface-container-high border border-outline-variant/20 mb-4">
            <span className="font-label text-tertiary text-sm tracking-widest uppercase">The Future of Career Prep</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-on-surface to-on-surface/60 bg-clip-text text-transparent">
            Master Your Next Interview with <br className="hidden md:block"/>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent typing-cursor">
              {typedText}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-on-surface-variant text-lg md:text-xl font-body leading-relaxed">
            Experience the world&apos;s most advanced AI-powered interview simulator. Refine your narrative, track biometric cues, and conquer high-stakes meetings.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-8">
            <Link
              href="/auth/login"
              className="bipolar-gradient px-10 py-5 rounded-xl text-on-primary font-headline font-extrabold text-lg shadow-[0_0_40px_rgba(175,198,255,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              Start Practice
            </Link>
            <button className="glass-panel px-10 py-5 rounded-xl text-primary font-headline font-bold text-lg hover:bg-surface-container-highest transition-all active:scale-95">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Abstract Tech Visual */}
        <div className="mt-20 w-full max-w-6xl rounded-t-3xl glass-panel p-4 shadow-2xl relative">
          <div className="w-full h-[400px] rounded-t-2xl overflow-hidden bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-lowest relative">
            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(175, 198, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(175, 198, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}></div>
            </div>

            {/* Central Orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Outer Glow */}
                <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-primary/30 via-secondary/20 to-tertiary/30 blur-3xl absolute -inset-8 animate-pulse"></div>
                {/* Core Orb */}
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary opacity-80 blur-md absolute -inset-4"></div>
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/90 to-secondary/90 relative flex items-center justify-center shadow-2xl">
                  <span className="material-symbols-outlined text-7xl text-white/90">smart_toy</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-12 left-16 w-20 h-20 rounded-xl bg-primary/20 backdrop-blur-sm rotate-12 animate-[float_3s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-16 right-20 w-16 h-16 rounded-lg bg-secondary/20 backdrop-blur-sm -rotate-12 animate-[float_4s_ease-in-out_infinite_0.5s]"></div>
            <div className="absolute top-20 right-32 w-12 h-12 rounded-full bg-tertiary/20 backdrop-blur-sm animate-[float_3.5s_ease-in-out_infinite_1s]"></div>
            <div className="absolute bottom-12 left-32 w-24 h-24 rounded-2xl bg-primary/10 backdrop-blur-sm rotate-45 animate-[float_4.5s_ease-in-out_infinite_0.3s]"></div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#afc6ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ddb7ff" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="80%" y1="40%" x2="50%" y2="50%" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="30%" y1="70%" x2="50%" y2="50%" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="70%" y1="80%" x2="50%" y2="50%" stroke="url(#lineGrad)" strokeWidth="2" />
            </svg>

            {/* Title Overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <div className="text-4xl font-headline font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent drop-shadow-lg">
                Luminal AI
              </div>
              <div className="text-sm font-label text-on-surface-variant/80 mt-2 tracking-widest uppercase">
                AI-Powered Interview Simulator
              </div>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
          </div>
        </div>
      </header>

      {/* Features Showcase */}
      <section ref={revealRef1} className="reveal py-32 px-6 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">Built for elite performance.</h2>
              <p className="text-on-surface-variant text-lg">We&apos;ve combined neural linguistics with emotional intelligence to build a training ground that feels frighteningly real.</p>
            </div>
            <div className="pb-2">
              <span className="font-label text-tertiary-fixed text-sm uppercase tracking-widest px-4 py-2 bg-tertiary-container/20 rounded-full">Core Features</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Voice AI */}
            <TiltCard className="glass-panel p-8 rounded-xl space-y-6 hover:bg-surface-container-high transition-all duration-500 group">
              <div className="w-14 h-14 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-headline font-bold">Voice AI Interactions</h3>
              <p className="text-on-surface-variant leading-relaxed">Natural, fluid conversations that adapt to your tone, pace, and vocabulary. No canned responses.</p>
              <div className="h-1 bipolar-gradient w-0 group-hover:w-full transition-all duration-700"></div>
            </TiltCard>

            {/* Resume Scenarios */}
            <TiltCard className="glass-panel p-8 rounded-xl space-y-6 hover:bg-surface-container-high transition-all duration-500 group">
              <div className="w-14 h-14 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-headline font-bold">Resume-Based Scenarios</h3>
              <p className="text-on-surface-variant leading-relaxed">Our AI parses your experience to generate specific, challenging probes about your past projects and skills.</p>
              <div className="h-1 bipolar-gradient w-0 group-hover:w-full transition-all duration-700"></div>
            </TiltCard>

            {/* Real-time Tracking */}
            <TiltCard className="glass-panel p-8 rounded-xl space-y-6 hover:bg-surface-container-high transition-all duration-500 group">
              <div className="w-14 h-14 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-headline font-bold">Real-time Attention Tracking</h3>
              <p className="text-on-surface-variant leading-relaxed">Subtle analysis of your eye contact, filler word usage, and emotional composure throughout the session.</p>
              <div className="h-1 bipolar-gradient w-0 group-hover:w-full transition-all duration-700"></div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={revealRef2} className="reveal py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <Counter target={10000} suffix="+" />
              </div>
              <div className="font-label text-sm uppercase tracking-widest text-on-surface-variant">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-bold bg-gradient-to-r from-secondary to-tertiary bg-clip-text text-transparent">
                <Counter target={500} suffix="+" />
              </div>
              <div className="font-label text-sm uppercase tracking-widest text-on-surface-variant">Top Companies</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-bold bg-gradient-to-r from-tertiary to-primary bg-clip-text text-transparent">
                <Counter target={95} suffix="%" />
              </div>
              <div className="font-label text-sm uppercase tracking-widest text-on-surface-variant">Success Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-bold bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
                <Counter target={50000} suffix="+" />
              </div>
              <div className="font-label text-sm uppercase tracking-widest text-on-surface-variant">Sessions Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={revealRef3} className="reveal py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-4xl md:text-5xl font-headline font-bold mb-20">The Evolution of Prep</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Step 1 */}
            <div className="md:col-span-4 glass-panel rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
              <div className="space-y-4">
                <span className="font-label text-primary text-5xl font-bold opacity-20">01</span>
                <h4 className="text-3xl font-headline font-bold">Upload</h4>
                <p className="text-on-surface-variant">Import your CV and the specific job description. Our engine maps your competitive advantages and potential pitfalls.</p>
              </div>
              <div className="mt-8 flex justify-center">
                <svg className="w-20 h-20 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="md:col-span-8 glass-panel rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden group">
              <div className="flex-1 space-y-4">
                <span className="font-label text-secondary text-5xl font-bold opacity-20">02</span>
                <h4 className="text-3xl font-headline font-bold">Practice</h4>
                <p className="text-on-surface-variant">Step into the simulator. Engage with high-fidelity personas ranging from technical architects to HR directors.</p>
                <div className="pt-4 flex gap-2">
                  <div className="w-8 h-1 rounded-full bg-secondary"></div>
                  <div className="w-2 h-1 rounded-full bg-outline-variant"></div>
                  <div className="w-2 h-1 rounded-full bg-outline-variant"></div>
                </div>
              </div>
              <div className="flex-1 w-full h-full min-h-[200px] rounded-2xl overflow-hidden shadow-2xl relative group">
                {/* Practice Section Image */}
                <Image
                  src="/practice-image.png"
                  alt="AI Interview Practice Session"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-tertiary/0 group-hover:from-primary/20 group-hover:via-secondary/10 group-hover:to-tertiary/20 transition-all duration-500"></div>
                {/* Border Glow */}
                <div className="absolute inset-0 rounded-2xl border border-outline-variant/20 group-hover:border-primary/40 transition-colors duration-500"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="md:col-span-12 glass-panel rounded-3xl p-10 flex flex-col md:flex-row justify-between items-center group">
              <div className="max-w-md space-y-4">
                <span className="font-label text-tertiary text-5xl font-bold opacity-20">03</span>
                <h4 className="text-3xl font-headline font-bold">Analyze</h4>
                <p className="text-on-surface-variant">Receive a granular breakdown of your performance. From technical accuracy to persuasive psychology, know exactly where you stand.</p>
              </div>
              <div className="flex gap-4 mt-8 md:mt-0">
                <div className="w-40 h-40 glass-panel rounded-2xl flex flex-col items-center justify-center text-center p-4 border-tertiary/20">
                  <span className="text-tertiary font-headline font-bold text-3xl">92%</span>
                  <span className="text-xs font-label uppercase mt-2">Clarity</span>
                </div>
                <div className="w-40 h-40 glass-panel rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <span className="text-secondary font-headline font-bold text-3xl">88%</span>
                  <span className="text-xs font-label uppercase mt-2">Sentiment</span>
                </div>
                <div className="w-40 h-40 glass-panel rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <span className="text-primary font-headline font-bold text-3xl">Top 5</span>
                  <span className="text-xs font-label uppercase mt-2">Percentile</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={revealRef4} className="reveal py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-surface-container-high relative overflow-hidden text-center p-20 shadow-2xl animate-pulse-glow">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,#afc6ff_0%,transparent_50%)]"></div>
          </div>
          <div className="relative z-10 space-y-10">
            <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">Ready to command the room?</h2>
            <p className="text-xl text-on-surface-variant max-w-xl mx-auto font-body">Join over 10,000 professionals who have leveled up their careers using Luminal&apos;s ethereal intelligence engine.</p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="bipolar-gradient px-12 py-6 rounded-2xl text-on-primary font-headline font-extrabold text-xl shadow-[0_20px_50px_rgba(175,198,255,0.2)] hover:shadow-[0_20px_60px_rgba(175,198,255,0.4)] transition-all hover:-translate-y-1 inline-block"
              >
                Get Started for Free
              </Link>
            </div>
            <div className="flex justify-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-label uppercase tracking-tighter">No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-label uppercase tracking-tighter">3 Free Sessions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
