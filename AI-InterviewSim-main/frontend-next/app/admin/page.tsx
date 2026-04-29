'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface AdminStats {
  total_users: number;
  total_interviews: number;
  completed_interviews: number;
  active_subscriptions: number;
  recent_signups: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirectTo=/admin');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await api.get('/api/admin/stats');
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('You do not have admin access.');
        } else {
          setError('Failed to load admin stats.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant animate-pulse">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="glass-panel rounded-xl p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-4xl text-error mb-4">block</span>
          <h2 className="text-xl font-headline font-bold mb-2">Access Denied</h2>
          <p className="text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
          Admin <span className="text-tertiary">Dashboard</span>
        </h1>
        <p className="text-on-surface-variant mb-12">Overview of platform metrics and user activity.</p>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
            {[
              { label: 'Total Users', value: stats.total_users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Interviews', value: stats.total_interviews, color: 'text-secondary', bg: 'bg-secondary/10' },
              { label: 'Completed', value: stats.completed_interviews, color: 'text-tertiary', bg: 'bg-tertiary/10' },
              { label: 'Active Subs', value: stats.active_subscriptions, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'New This Week', value: stats.recent_signups, color: 'text-secondary', bg: 'bg-secondary/10' },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel rounded-xl p-6 text-center">
                <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                  <span className={`text-2xl font-bold font-headline ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="text-xs text-on-surface-variant font-label uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="glass-panel rounded-xl p-8">
          <h2 className="text-2xl font-headline font-bold mb-4">Environment Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { key: 'Database', value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not configured' },
              { key: 'API URL', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' },
              { key: 'Stripe', value: 'Configured' },
              { key: 'Redis', value: 'Configured' },
            ].map((item) => (
              <div key={item.key} className="flex justify-between p-3 rounded-lg bg-surface-container-lowest/50">
                <span className="text-on-surface-variant">{item.key}</span>
                <span className="font-label font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
