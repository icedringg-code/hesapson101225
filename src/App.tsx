import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import JobDetailPage from './pages/JobDetailPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

type ViewType =
  | { type: 'dashboard' }
  | { type: 'job'; jobId: string }
  | { type: 'company'; companyId: string; jobId: string };

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'dashboard' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      {currentView.type === 'job' && (
        <JobDetailPage
          jobId={currentView.jobId}
          onBack={() => setCurrentView({ type: 'dashboard' })}
          onCompanyClick={(companyId) =>
            setCurrentView({ type: 'company', companyId, jobId: currentView.jobId })
          }
        />
      )}

      {currentView.type === 'company' && (
        <CompanyDetailPage
          companyId={currentView.companyId}
          jobId={currentView.jobId}
          onBack={() => setCurrentView({ type: 'job', jobId: currentView.jobId })}
        />
      )}

      {currentView.type === 'dashboard' && (
        <Dashboard
          onJobClick={(jobId) => setCurrentView({ type: 'job', jobId })}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <PWAInstallPrompt />
    </AuthProvider>
  );
}

export default App;
