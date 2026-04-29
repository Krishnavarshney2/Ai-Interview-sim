import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedLayout, { getUserSession } from '../../components/ProtectedLayout';
import { redirect } from 'next/navigation';

export default async function PracticePage() {
  const user = await getUserSession();
  if (!user) {
    redirect('/auth/login?redirectTo=/practice');
  }

  const practiceModes = [
    {
      title: 'Mock Interview',
      description: 'Full simulation with AI interviewer. Choose your role, difficulty, and mode.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      href: '/setup',
      color: 'from-primary to-secondary',
    },
    {
      title: 'Text Practice',
      description: 'Text-based interview for focused, async practice without camera or mic.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: '/setup',
      color: 'from-secondary to-tertiary',
    },
    {
      title: 'Quick Start',
      description: 'Jump straight into a Senior Software Engineer interview with default settings.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: '/setup',
      color: 'from-tertiary to-primary',
    },
  ];

  const tips = [
    'Research the company culture before starting.',
    'Use the STAR method for behavioral questions.',
    'Practice speaking slowly and clearly.',
    'Review your resume before the session.',
  ];

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
            Practice <span className="text-tertiary">Centre</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Choose a practice mode to sharpen your interview skills. Each session is tailored to your target role.
          </p>
        </div>

        {/* Practice Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {practiceModes.map((mode) => (
            <Link
              key={mode.title}
              href={mode.href}
              className="glass-panel rounded-xl p-8 hover:bg-surface-container-high transition-all group space-y-6"
            >
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center text-on-primary`}>
                {mode.icon}
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold mb-2">{mode.title}</h2>
                <p className="text-on-surface-variant leading-relaxed">{mode.description}</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-label font-bold text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                Start Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Tips Section */}
        <section className="glass-panel rounded-xl p-8">
          <h2 className="text-2xl font-headline font-bold mb-6">Interview Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-lowest/50">
                <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-sm">lightbulb</span>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
