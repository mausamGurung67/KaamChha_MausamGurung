import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import FloatingChat from './components/chat/FloatingChat';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <SocketProvider>
      <AppRoutes />
      {/* Floating chat widget — only for logged-in customers */}
      {user?.role === 'CUSTOMER' && <FloatingChat />}
    </SocketProvider>
  );
};

import React from 'react';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Satoshi, sans-serif',
            },
            success: {
              style: {
                background: '#fff7ed',
                color: '#c2410c',
                border: '1px solid #fed7aa',
              },
              iconTheme: {
                primary: '#f97316',
                secondary: '#fff7ed',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              },
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fef2f2',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;