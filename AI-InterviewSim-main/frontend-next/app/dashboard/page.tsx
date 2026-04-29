'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { interviewAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface RecentActivity {
  id: string;
  role: string;
  company: string;
  date: string;
  duration: string;
  score: string;
  scoreColor: string;
  status: string;
}

interface Stats {
  total_interviews: number;
  completed: number;
  in_progress: number;
  average_score: number;
  total_practice_time_hours: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirectTo=/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          interviewAPI.getUserStats(),
          interviewAPI.getRecentInterviews(5),
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (recentRes.success) {
          setRecentActivity(recentRes.recent);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const userName = user?.email?.split('@')[0] || 'User';

  const statCards = [
    {
      label: 'Interviews',
      value: stats?.total_interviews ?? 0,
      subtext: `${stats?.completed ?? 0} completed`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Avg Score',
      value: stats?.average_score ?? 0,
      subtext: 'Out of 100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-tertiary',
      bg: 'bg-tertiary/10',
    },
    {
      label: 'Practice Time',
      value: `${stats?.total_practice_time_hours ?? 0}h`,
      subtext: 'Total logged',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: 'In Progress',
      value: stats?.in_progress ?? 0,
      subtext: 'Active sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'text-outline',
      bg: 'bg-outline/10',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto space-y-12 min-h-screen">
        {/* Hero Welcome Header */}
        <header className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight">
              Welcome back, <span className="text-gradient">{userName}</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-xl font-body">
              {stats && stats.total_interviews > 0
                ? `You've completed ${stats.total_interviews} interview sessions. Keep practicing to improve your scores.`
                : "Start your first mock interview to track your progress and get AI-powered feedback."}
            </p>
          </div>
          <div className="surface-container-low p-8 rounded-xl flex flex-col items-center justify-center space-y-2 text-center border-l-4 border-tertiary shadow-lg">
            <span className="text-on-surface-variant font-label text-sm uppercase tracking-widest">Average Score</span>
            <span className="text-5xl font-black font-headline text-tertiary">{stats?.average_score ?? 0}</span>
            <span className="text-xs text-tertiary/60 font-label">
              {stats && stats.total_interviews > 0 ? 'BASED ON YOUR SESSIONS' : 'NO DATA YET'}
            </span>
          </div>
        </header>

        {/* Stats Overview & Primary Action Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Large Action Card */}
          <div className="md:col-span-2 md:row-span-2 glass-morphism rounded-xl overflow-hidden relative group p-8 flex flex-col justify-between border border-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bipolar-gradient rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold font-headline leading-tight">Master your next<br/>big career move.</h2>
              <p className="text-on-surface-variant font-body">AI-powered mock interviews tailored to specific job descriptions and company cultures.</p>
            </div>
            <div className="relative z-10 pt-8">
              <Link
                href="/setup"
                className="bipolar-gradient w-full py-4 rounded-xl font-bold text-on-primary flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(175,198,255,0.3)] transition-all"
              >
                Start New Mock Interview
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {statCards.map((stat) => (
            <div key={stat.label} className="surface-container-low p-6 rounded-xl space-y-4 hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{stat.label}</span>
              </div>
              <div>
                <div className="text-3xl font-bold font-headline">{stat.value}</div>
                <div className="text-xs text-on-surface-variant">{stat.subtext}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Recent Activity Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold font-headline">Recent Activity</h3>
            <Link href="/history" className="text-primary hover:text-secondary font-label text-sm uppercase tracking-widest transition-colors flex items-center gap-2">
              View Full History
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">history</span>
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">No interviews yet</h3>
              <p className="text-on-surface-variant mb-6">Complete your first mock interview to see activity here.</p>
              <Link href="/setup" className="bipolar-gradient px-8 py-3 rounded-xl text-on-primary font-headline font-bold inline-block">
                Start Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="surface-container-low p-6 rounded-xl grid grid-cols-1 md:grid-cols-4 items-center gap-4 hover:bg-surface-container-high transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                      <span className="text-lg font-bold font-headline">{activity.company[0]}</span>
                    </div>
                    <div>
                      <div className="font-bold font-body">{activity.role}</div>
                      <div className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">{activity.company}</div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Date</span>
                    <span className="font-body text-sm">{activity.date}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Duration</span>
                    <span className="font-body text-sm">{activity.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Score</span>
                      <span className={`font-bold ${activity.scoreColor}`}>{activity.score}</span>
                    </div>
                    <Link
                      href={`/feedback?id=${activity.id}`}
                      className="p-2 rounded-full border border-outline-variant/30 text-on-surface-variant hover:bg-tertiary hover:text-on-tertiary transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
