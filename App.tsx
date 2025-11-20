import * as React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CVProvider } from './store/CVContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { UploadArea } from './components/UploadArea';
import { MemberGrid } from './components/MemberGrid';
import { AgentChat } from './components/AgentChat';
import { Login } from './components/Login';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PublicStats } from './components/PublicStats';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0E14]">
      {/* Desktop sidebar (hidden on small screens) */}
      <Sidebar />

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
          <Sidebar isMobile onClose={() => setMobileOpen(false)} />
        </>
      )}

      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-x-hidden flex flex-col">
          <div className="w-full max-w-screen-2xl mx-auto flex-1">
          {/* Mobile top bar: menu button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white/5 text-white hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-90">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B0E14]">
        <LoadingSpinner />
      </div>
    );
  }

  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <CVProvider>
        <Router>
          <Routes>
            {/* Public Route - No Authentication Required */}
            <Route path="/public-stats" element={<PublicStats />} />

            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <PrivateRoute>
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Visão Geral da EJ</h2>
                    <div>
                      {/* Share button opens the public stats page in a new tab */}
                      <a
                        href={`${window.location.origin}${window.location.pathname}#/public-stats`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Abrir estatísticas públicas"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 text-white hover:bg-white/10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-90">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 10-2.83-4.24M15 8v6m0 0l3-3m-3 3l-3-3" />
                        </svg>
                        <span className="text-sm">Compartilhar</span>
                      </a>
                    </div>
                  </div>
                  <DashboardStats />
                </>
              </PrivateRoute>
            } />

            <Route path="/members" element={
              <PrivateRoute>
                <>
                  <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Membros</h2>
                  <MemberGrid />
                </>
              </PrivateRoute>
            } />

            <Route path="/agent" element={
              <PrivateRoute>
                <AgentChat />
              </PrivateRoute>
            } />

            <Route path="/upload" element={
              <PrivateRoute>
                <>
                  <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Importar Dados</h2>
                  <UploadArea />
                </>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </CVProvider>
    </AuthProvider>
  );
}

export default App;
