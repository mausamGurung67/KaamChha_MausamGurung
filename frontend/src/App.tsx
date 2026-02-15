import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import FloatingChat from './components/chat/FloatingChat';
import { useAuth } from './hooks/useAuth';
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;