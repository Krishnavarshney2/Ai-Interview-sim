'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { interviewAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Interview {
  id: string;
  role: string;
  rounds_total: number;
  rounds_completed: number;
  status: string;
  score: number | null;
  duration_seconds: number | null;
  created_at: string | null;
  completed_at: string | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, in_progress: 0, avg_score: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirectTo=/history');
      return;
    }

    const fetchData = async () => {
      try {
        const [historyRes, statsRes] = await Promise.all([
          interviewAPI.getHistory(),
          interviewAPI.getUserStats(),
        ]);

        if (historyRes.success) {
          setInterviews(historyRes.history);
        }
        if (statsRes.success) {
          const s = statsRes.stats;
          setStats({
            total: s.total_interviews || 0,
            completed: s.completed || 0,
            in_progress: s.in_progress || 0,
            avg_score: s.average_score || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-on-surface-variant';
    const s = score * 20; // Convert 0-5 to 0-100
    if (s >= 90) return 'text-tertiary';
    if (s >= 80) return 'text-primary';
    if (s >= 70) return 'text-secondary';
    return 'text-error';
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return 'bg-surface-container-high';
    const s = score * 20;
    if (s >= 90) return 'bg-tertiary/10';
    if (s >= 80) return 'bg-primary/10';
    if (s >= 70) return 'bg-secondary/10';
    return 'bg-error/10';
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant animate-pulse">Loading history...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="mb-12">
          <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
            Interview <span className="text-tertiary">History</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Review your past interview sessions, scores, and feedback. Track your progress over time.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Sessions', value: stats.total },
            { label: 'Completed', value: stats.completed },
            { label: 'In Progress', value: stats.in_progress },
            { label: 'Average Score', value: stats.avg_score },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-xl p-6 space-y-2">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{stat.label}</span>
              <div className="text-3xl font-bold font-headline text-on-surface">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline font-bold">Recent Sessions</h2>
          </div>

          {interviews.length === 0 ? (
            <div className="glass-panel rounded-xl p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">history</span>
              </div>
              <h2 className="text-2xl font-headline font-bold mb-2">No interviews yet</h2>
              <p className="text-on-surface-variant mb-8">Start your first mock interview to see your history here.</p>
              <Link href="/setup" className="bipolar-gradient px-8 py-4 rounded-xl text-on-primary font-headline font-bold inline-block">
                Start Interview
              </Link>
            </div>
          ) : (
            interviews.map((interview) => (
              <div
                key={interview.id}
                className="glass-panel rounded-xl p-6 grid grid-cols-1 md:grid-cols-6 items-center gap-4 hover:bg-surface-container-high transition-all group"
              >
                <div className="md:col-span-2 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                    <span className="text-lg font-bold font-headline">{interview.role[0]}</span>
                  </div>
                  <div>
                    <div className="font-bold font-body">{interview.role}</div>
                    <div className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
                      {interview.rounds_completed}/{interview.rounds_total} rounds
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Date</span>
                  <span className="font-body text-sm">{formatDate(interview.created_at)}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Duration</span>
                  <span className="font-body text-sm">{formatDuration(interview.duration_seconds)}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Status</span>
                  <span className={`font-body text-sm capitalize ${interview.status === 'completed' ? 'text-tertiary' : 'text-secondary'}`}>
                    {interview.status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className={`w-14 h-14 rounded-xl ${getScoreBg(interview.score)} flex items-center justify-center`}>
                    <span className={`font-bold font-headline ${getScoreColor(interview.score)}`}>
                      {interview.score ? Math.round(interview.score * 20) : '-'}
                    </span>
                  </div>
                  {interview.status === 'completed' && (
                    <Link
                      href={`/feedback?id=${interview.id}`}
                      className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
