import Nav from './Nav.jsx';

export default function Layout({ children }) {
  return (
    <div className="min-h-full bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-xs text-slate-400">
        Inter Vertebra v0.1.0 · audit/research tool, not for clinical decision support
      </footer>
    </div>
  );
}
