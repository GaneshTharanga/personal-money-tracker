import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'Money Tracker',
  description: 'Simple personal money tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">Money Tracker</div>
            <Navigation />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
