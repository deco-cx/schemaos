import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { AfterLogin } from './pages/AfterLogin';
import { Logout } from './pages/Logout';
import { AppLayout } from './pages/AppLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/after-login" element={<AfterLogin />} />
          <Route path="/logout" element={<Logout />} />
          
          {/* Protected routes */}
          <Route path="/app" element={<AppLayout />} />
          <Route path="/app/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;