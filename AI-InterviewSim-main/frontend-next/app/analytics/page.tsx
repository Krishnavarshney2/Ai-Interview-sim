'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { interviewAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [categoryAverages, setCategoryAverages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirectTo=/analytics');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, weeklyRes] = await Promise.all([
          interviewAPI.getUserStats(),
          interviewAPI.getScoreTrends(),
          interviewAPI.getWeeklyActivity(),
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
          setCategoryAverages(statsRes.category_averages || {});
        }
        if (trendsRes.success) {
          setTrends(trendsRes.trends);
        }
        if (weeklyRes.success) {
          setWeekly(weeklyRes.weekly);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  // Build radar data from category averages
  const radarData = Object.entries(categoryAverages).map(([subject, score]) => ({
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    A: score,
    fullMark: 100,
  }));

  // Build category bar data
  const categoryData = Object.entries(categoryAverages).map(([name, score]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    score,
  }));

  // Find lowest categories for improvement tips
  const sortedCategories = [...categoryData].sort((a, b) => a.score - b.score);
  const improvementAreas = sortedCategories.slice(0, 2);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  const hasData = stats && stats.total_interviews > 0;

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="mb-12">
          <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
            Analytics <span className="text-tertiary">Dashboard</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Track your interview performance, identify strengths, and focus on areas for improvement.
          </p>
        </div>

        {!hasData ? (
          <div className="glass-panel rounded-xl p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">analytics</span>
            </div>
            <h2 className="text-2xl font-headline font-bold mb-2">No data yet</h2>
            <p className="text-on-surface-variant mb-8">Complete a few interviews to see your analytics.</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Interviews', value: stats.total_interviews || 0, change: '+this week', color: 'text-primary' },
                { label: 'Avg Score', value: stats.average_score || 0, change: 'out of 100', color: 'text-tertiary' },
                { label: 'Best Score', value: trends.length > 0 ? Math.max(...trends.map(t => t.score)) : 0, change: 'highest', color: 'text-secondary' },
                { label: 'Practice Time', value: `${stats.total_practice_time_hours || 0}h`, change: 'total', color: 'text-primary' },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel rounded-xl p-6 space-y-2">
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{stat.label}</span>
                  <div className={`text-4xl font-bold font-headline ${stat.color}`}>{stat.value}</div>
                  <span className="text-xs text-on-surface-variant/60">{stat.change}</span>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {/* Score Trend */}
              <div className="glass-panel rounded-xl p-8">
                <h2 className="text-xl font-headline font-bold mb-6">Score Trend</h2>
                <div className="h-64">
                  {trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="score" stroke="#afc6ff" strokeWidth={3} dot={{ fill: '#afc6ff', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant">No trend data yet</div>
                  )}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="glass-panel rounded-xl p-8">
                <h2 className="text-xl font-headline font-bold mb-6">Category Breakdown</h2>
                <div className="h-64">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                        <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Bar dataKey="score" fill="#ddb7ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant">No category data yet</div>
                  )}
                </div>
              </div>

              {/* Skill Radar */}
              <div className="glass-panel rounded-xl p-8">
                <h2 className="text-xl font-headline font-bold mb-6">Skill Profile</h2>
                <div className="h-64">
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.6)" fontSize={11} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
                        <Radar name="Your Score" dataKey="A" stroke="#afc6ff" fill="#afc6ff" fillOpacity={0.3} strokeWidth={2} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant">No skill data yet</div>
                  )}
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="glass-panel rounded-xl p-8">
                <h2 className="text-xl font-headline font-bold mb-6">Weekly Activity</h2>
                <div className="h-64">
                  {weekly.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Bar dataKey="interviews" fill="#7cb69d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant">No weekly data yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Improvement Tips */}
            {improvementAreas.length > 0 && (
              <section className="glass-panel rounded-xl p-8">
                <h2 className="text-2xl font-headline font-bold mb-6">Areas for Improvement</h2>
                <div className="space-y-4">
                  {improvementAreas.map((item) => (
                    <div key={item.name} className="flex items-center gap-6 p-4 rounded-lg bg-surface-container-lowest/50">
                      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-error font-bold font-headline">{item.score}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline font-bold text-lg">{item.name}</h3>
                        <p className="text-on-surface-variant text-sm">Focus on improving your {item.name.toLowerCase()} skills in upcoming practice sessions.</p>
                      </div>
                      <div className="w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-error rounded-full" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
