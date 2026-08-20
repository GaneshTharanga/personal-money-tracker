'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (pathname === '/login') return;
    fetch('/api/auth/me', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) return router.replace('/login');
      setUser((await response.json()).user);
    });
  }, [pathname, router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); router.replace('/login'); router.refresh();
  }

  if (pathname === '/login') return null;
  return (
    <div className="nav-area"><nav className="nav" aria-label="Main navigation">
      <Link className={pathname === '/' ? 'active' : ''} href="/">Dashboard</Link>
      <Link className={pathname.startsWith('/transactions') ? 'active' : ''} href="/transactions">Transactions</Link>
    </nav>{user && <div className="user-menu"><span>{user.username}</span><button onClick={logout}>Sign out</button></div>}</div>
  );
}
