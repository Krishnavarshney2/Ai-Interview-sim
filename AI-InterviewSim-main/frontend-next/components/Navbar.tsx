'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Practice', href: '/practice' },
    { name: 'History', href: '/history' },
    { name: 'Analytics', href: '/analytics' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
      <div className="flex justify-between items-center px-8 h-20 w-full max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#afc6ff] to-[#ddb7ff] bg-clip-text text-transparent font-headline tracking-tight">
          Luminal AI
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`font-headline pb-1 transition-colors ${
                pathname === item.href
                  ? 'text-[#afc6ff] border-b-2 border-[#afc6ff]'
                  : 'text-[#dae2fd]/60 hover:text-[#dae2fd]'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/profile"
                className={`hidden lg:flex items-center gap-2 text-sm font-label transition-colors ${
                  pathname === '/profile' ? 'text-[#afc6ff]' : 'text-[#dae2fd]/60 hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                {user.email?.split('@')[0]}
              </Link>
              <Link
                href="/profile"
                className="lg:hidden p-2 text-[#dae2fd]/60 hover:text-[#dae2fd] rounded-full transition-all"
                title="Profile"
              >
                <span className="material-symbols-outlined">person</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2 text-error hover:bg-[#2d3449]/40 rounded-full transition-all duration-300"
                title="Sign Out"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
              <Link
                href="/setup"
                className="ml-2 bipolar-gradient text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold scale-95 active:scale-90 transition-all duration-200"
              >
                Start Interview
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[#afc6ff] hover:text-[#dae2fd] transition-colors font-headline font-bold"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="ml-2 bipolar-gradient text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold scale-95 active:scale-90 transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
