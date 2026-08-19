import Link from 'next/link';
import { isAuthenticated, destroySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLeadCounts, getStackCounts } from '@/lib/db';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (!authed) {
    await destroySession();
    redirect('/admin/login');
  }

  const [leadCounts, stackCounts] = await Promise.all([
    getLeadCounts(),
    getStackCounts(),
  ]);

  const navItems = [
    {
      href: '/admin/leads',
      label: 'LEADS',
      count: leadCounts.total,
      accent: leadCounts.byStatus.new > 0 ? 'text-yellow-400' : 'text-green-400',
    },
    {
      href: '/admin/stack',
      label: 'STACK STATUS',
      count: stackCounts.total,
      accent: 'text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-black text-green-400 font-mono">
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#0a3f0a 1px, transparent 1px), linear-gradient(90deg, #0a3f0a 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <aside className="w-64 border-r border-green-900/50 bg-black/60 backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-green-900/50">
            <div className="text-yellow-400 text-xs tracking-widest mb-2">{'// SYS_CONSOLE'}</div>
            <h1 className="text-lg font-bold text-green-400 tracking-wider">ADMIN</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600">AUTHENTICATED</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between px-4 py-3 border border-green-900/30 hover:border-green-500/50 hover:bg-green-900/10 transition-colors"
              >
                <span className="text-sm tracking-wider text-green-400 group-hover:text-green-300">
                  {item.label}
                </span>
                <span className={`text-xs font-bold ${item.accent}`}>{item.count}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-green-900/50 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-green-600">
                <span>NEW LEADS</span>
                <span className="text-yellow-400 font-bold">{leadCounts.byStatus.new}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>STACK ACTIVE</span>
                <span className="text-green-400 font-bold">
                  {stackCounts.byStatus.active + stackCounts.byStatus.partner}
                </span>
              </div>
            </div>
            <form
              action={async () => {
                'use server';
                await destroySession();
                redirect('/admin/login');
              }}
            >
              <button
                type="submit"
                className="w-full py-2 border border-red-900/50 text-red-400 text-xs tracking-wider hover:bg-red-900/20 hover:border-red-500/50 transition-colors"
              >
                {'> LOGOUT'}
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-green-900/50 bg-black/60 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-green-700 text-sm">{'~/'}</span>
              <span className="text-gray-500 text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 border border-green-900/50 text-xs">
                <span className="text-green-700">{'CPU:'}</span>
                <span className="text-green-500">23%</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 border border-green-900/50 text-xs">
                <span className="text-green-700">{'MEM:'}</span>
                <span className="text-green-500">61%</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
