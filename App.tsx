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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#0B0E14]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
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
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <>
                  <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Visão Geral da EJ</h2>
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
                <>
                  <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Headhunter IA</h2>
                  <p className="text-slate-400 mb-8">Descreva sua necessidade e encontre o time ideal.</p>
                  <AgentChat />
                </>
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
