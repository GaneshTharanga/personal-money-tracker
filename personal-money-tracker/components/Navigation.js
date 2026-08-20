'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Main navigation">
      <Link className={pathname === '/' ? 'active' : ''} href="/">Dashboard</Link>
      <Link className={pathname.startsWith('/transactions') ? 'active' : ''} href="/transactions">Transactions</Link>
    </nav>
  );
}
