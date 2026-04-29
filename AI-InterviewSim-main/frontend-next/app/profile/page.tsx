'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { interviewAPI } from '../../lib/api';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirectTo=/profile');
      return;
    }

    setEmail(user.email || '');
    setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');

    const fetchStats = async () => {
      try {
        const res = await interviewAPI.getUserStats();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Update user metadata in Supabase
      const { error } = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).then(r => r.json());

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto min-h-screen">
        <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
          Your <span className="text-tertiary">Profile</span>
        </h1>
        <p className="text-on-surface-variant mb-12">Manage your account settings and view your progress.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Interviews', value: stats?.total_interviews || 0 },
            { label: 'Completed', value: stats?.completed || 0 },
            { label: 'Avg Score', value: stats?.average_score || 0 },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-xl p-6 text-center">
              <div className="text-3xl font-bold font-headline text-on-surface">{stat.value}</div>
              <div className="text-xs text-on-surface-variant font-label uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-xl p-8 space-y-8">
          <h2 className="text-2xl font-headline font-bold">Account Settings</h2>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${message.includes('success') ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-label uppercase tracking-wider text-on-surface-variant mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-label uppercase tracking-wider text-on-surface-variant mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface-variant cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-on-surface-variant/60 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bipolar-gradient px-8 py-3 rounded-xl text-on-primary font-headline font-bold disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <div className="border-t border-outline-variant/20 pt-8 space-y-4">
            <h3 className="text-lg font-headline font-bold text-error">Danger Zone</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => signOut()}
                className="px-6 py-3 rounded-xl border border-error text-error font-headline font-bold hover:bg-error/10 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
