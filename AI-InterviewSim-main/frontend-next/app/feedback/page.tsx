'use client';

import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function FeedbackPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto min-h-screen">
        {/* Header Section */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="font-label text-tertiary tracking-widest uppercase text-xs mb-4 block">Interview Complete</span>
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface mb-6">Performance Report</h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">Your session with the <span className="text-primary font-semibold">Senior Product Analyst</span> persona is complete. We&apos;ve synthesized 2,400 data points to evaluate your technical aptitude and delivery.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest transition-all group">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-label text-sm font-bold uppercase tracking-wider">Export PDF</span>
            </button>
            <Link
              href="/setup"
              className="flex items-center gap-2 px-8 py-3 rounded-xl bipolar-gradient text-on-primary font-bold transition-all hover:shadow-[0_0_20px_rgba(175,198,255,0.4)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retake Interview</span>
            </Link>
          </div>
        </header>

        {/* Bento Grid Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          {/* Radar Chart Card */}
          <div className="md:col-span-7 lg:col-span-8 glass-panel rounded-3xl p-10 relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-2">Core Competencies</h3>
                  <p className="text-on-surface-variant text-sm">Multi-dimensional analysis of your performance metrics.</p>
                </div>
                <div className="bg-tertiary-container/20 px-4 py-2 rounded-full">
                  <span className="font-label text-tertiary text-sm font-bold">Overall Score: 84%</span>
                </div>
              </div>

              {/* Spider/Radar Chart Representation */}
              <div className="flex-grow flex items-center justify-center py-8">
                <div className="relative w-72 h-72 md:w-96 md:h-96">
                  {/* Background Circles/Spider Web */}
                  <svg className="w-full h-full opacity-20 stroke-outline" viewBox="0 0 400 400">
                    <circle cx="200" cy="200" fill="none" r="180" strokeWidth="1" />
                    <circle cx="200" cy="200" fill="none" r="140" strokeWidth="1" />
                    <circle cx="200" cy="200" fill="none" r="100" strokeWidth="1" />
                    <circle cx="200" cy="200" fill="none" r="60" strokeWidth="1" />
                    <line x1="200" x2="200" y1="20" y2="380" />
                    <line x1="44" x2="356" y1="110" y2="290" />
                    <line x1="44" x2="356" y1="290" y2="110" />
                  </svg>
                  {/* Data Polygon */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                    <path d="M200 40 L340 140 L320 300 L200 360 L80 300 L60 140 Z" fill="url(#grad)" fillOpacity="0.6" stroke="#afc6ff" strokeWidth="3" />
                    <defs>
                      <linearGradient id="grad" x1="0%" x2="100%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#afc6ff" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ddb7ff" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Labels */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-label text-[10px] uppercase tracking-widest text-primary">Clarity</div>
                  <div className="absolute top-20 -right-8 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Technical Accuracy</div>
                  <div className="absolute bottom-20 -right-8 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Confidence</div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Empathy</div>
                  <div className="absolute bottom-20 -left-8 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Structure</div>
                  <div className="absolute top-20 -left-8 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Adaptability</div>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights / Strengths Sidebar */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-3xl p-8 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="font-headline text-xl font-bold">Top Strengths</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary mt-2"></div>
                  <div>
                    <p className="font-bold text-on-surface mb-1">Crisp Technical Definitions</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Your explanation of ETL pipelines was precise and used industry-standard terminology effectively.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary mt-2"></div>
                  <div>
                    <p className="font-bold text-on-surface mb-1">Strategic Pacing</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">You maintained a steady 120 WPM, allowing the interviewer to digest complex information.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-low rounded-3xl p-8 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h3 className="font-headline text-xl font-bold">Growth Areas</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2"></div>
                  <div>
                    <p className="font-bold text-on-surface mb-1">Closing Summaries</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Try to conclude your multi-part answers with a 1-sentence recap to reinforce main points.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transcript Analysis */}
        <div className="glass-panel rounded-[2rem] p-1 overflow-hidden">
          <div className="bg-surface-container-lowest/80 p-8 flex justify-between items-center">
            <div>
              <h3 className="font-headline text-2xl font-bold">Interactive Transcript</h3>
              <p className="text-on-surface-variant text-sm mt-1">Review specific moments where our AI coaches detected high impact or improvement potential.</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/10 text-xs font-label">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> Insight
              </span>
              <span className="inline-flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/10 text-xs font-label">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Recommendation
              </span>
            </div>
          </div>

          <div className="h-[600px] overflow-y-auto p-10 space-y-12">
            {/* Interaction Block 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Interviewer (AI)</p>
                    <div className="bg-surface-container-high p-5 rounded-2xl rounded-tl-none">
                      &ldquo;How would you handle a stakeholder who insists on a feature that contradicts your data findings?&rdquo;
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <div className="space-y-2 text-right">
                    <p className="font-label text-xs uppercase tracking-widest text-primary">You (Candidate)</p>
                    <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl rounded-tr-none text-on-surface">
                      &ldquo;I would show them the dashboard and explain that the data doesn&apos;t support their idea. If they still want it, I&apos;d probably escalate it to my manager.&rdquo;
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-xs font-bold">U</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-secondary/5 border-l-2 border-secondary p-6 rounded-r-2xl h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8.293 15.707a1 1 0 010-1.414l1-1a1 1 0 00-1.414-1.414l-1 1a1 1 0 001.414 1.414zM11.293 13.293a1 1 0 01-1.414 1.414l1-1a1 1 0 001.414-1.414l-1 1zM14.707 13.293a1 1 0 011.414 1.414l1 1a1 1 0 001.414-1.414l-1-1a1 1 0 00-1.414 0z" />
                    </svg>
                    <span className="font-label text-xs font-bold text-secondary uppercase tracking-widest">Better Answer Suggestion</span>
                  </div>
                  <p className="text-sm italic text-on-surface/80 leading-relaxed">
                    &ldquo;Instead of jumping to escalation, try a collaborative approach: &lsquo;I&rsquo;d invite them to a deep-dive session to understand the business intuition behind the request, then present a phased A/B testing plan to validate the hypothesis safely.&rsquo;&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction Block 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 opacity-60">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Interviewer (AI)</p>
                    <div className="bg-surface-container-high p-5 rounded-2xl rounded-tl-none">
                      &ldquo;Tell me about a time you failed to meet a deadline.&rdquo;
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <div className="space-y-2 text-right">
                    <p className="font-label text-xs uppercase tracking-widest text-primary">You (Candidate)</p>
                    <div className="bg-surface-container-low p-5 rounded-2xl rounded-tr-none">
                      &ldquo;Once we underestimated a migration task. I communicated the delay early and we adjusted the launch date...&rdquo;
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-xs font-bold">U</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-tertiary/5 border-l-2 border-tertiary p-6 rounded-r-2xl h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-label text-xs font-bold text-tertiary uppercase tracking-widest">High Impact Moment</span>
                  </div>
                  <p className="text-sm text-on-surface/80 leading-relaxed">
                    Great use of the STAR method. You clearly identified the Situation, Task, Action, and emphasized the Result (maintaining stakeholder trust).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Footer */}
        <section className="mt-20 glass-panel rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none"></div>
          <h2 className="font-headline text-3xl font-bold mb-4">Ready to reach the next level?</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-10">Based on your history, we recommend practicing &lsquo;Handling Conflict&rsquo; and &lsquo;System Architecture&rsquo; scenarios to round out your profile.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-10 py-4 rounded-full bipolar-gradient text-on-primary font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/10">
              Browse Learning Tracks
            </button>
            <Link
              href="/dashboard"
              className="px-10 py-4 rounded-full bg-surface-container-highest text-on-surface font-bold hover:bg-surface-bright transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
