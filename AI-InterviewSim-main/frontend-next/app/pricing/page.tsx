'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { interviewAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '3 mock interviews per month',
      'Basic AI feedback',
      'Text & voice mode',
      'Resume upload',
    ],
    cta: 'Get Started',
    popular: false,
    priceId: '',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For serious job seekers',
    features: [
      'Unlimited mock interviews',
      'Detailed AI feedback & scoring',
      'Full analytics dashboard',
      'Priority support',
      'Interview history & trends',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    if (user) {
      interviewAPI.getSubscription().then((res) => {
        if (res.success && res.subscription) {
          setCurrentPlan(res.subscription.plan);
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      router.push('/auth/login?redirectTo=/pricing');
      return;
    }

    if (plan.name === 'Free') {
      router.push('/setup');
      return;
    }

    setLoading(plan.name);
    try {
      const res = await interviewAPI.createCheckoutSession(plan.priceId);
      if (res.success && res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
            Simple <span className="text-tertiary">Pricing</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
            Choose the plan that fits your interview preparation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-panel rounded-2xl p-8 relative ${
                plan.popular ? 'border-2 border-primary shadow-[0_0_40px_rgba(175,198,255,0.1)]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bipolar-gradient px-4 py-1 rounded-full text-on-primary text-xs font-label font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h2 className="text-2xl font-headline font-bold mb-2">{plan.name}</h2>
                <p className="text-on-surface-variant text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black font-headline">{plan.price}</span>
                  <span className="text-on-surface-variant">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-on-surface-variant text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.name || currentPlan === plan.name.toLowerCase()}
                className={`w-full py-4 rounded-xl font-headline font-bold text-lg transition-all ${
                  plan.popular
                    ? 'bipolar-gradient text-on-primary hover:shadow-[0_0_30px_rgba(175,198,255,0.3)]'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.name ? 'Loading...' : currentPlan === plan.name.toLowerCase() ? 'Current Plan' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-on-surface-variant text-sm">
            Questions? Contact us at{' '}
            <a href="mailto:support@luminalai.com" className="text-primary hover:text-secondary">
              support@luminalai.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
