import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Patients', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
];

export default function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-base font-semibold tracking-tight">
              Inter Vertebra
            </span>
            <span className="hidden text-xs uppercase tracking-wider text-slate-400 sm:inline">
              Spine ERAS Tracker
            </span>
          </div>
          <nav className="-mx-1 flex flex-wrap gap-x-1 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
