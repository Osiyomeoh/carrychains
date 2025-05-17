// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIProvider } from './contexts/AIContext';
// Import your wagmi config
import { wagmiConfig } from './wagmi';

// Import components
import LandingPage from './pages/LandingPage'; // Import the new landing page
import LayoutWithNavbar from './components/LayoutWithNavbar'; // Import the layout component
import HomePage from './pages/HomePage';
import FindRoutesPage from './pages/FindRoutesPage';
import CreateRoutePage from './pages/CreateRoutes';
import MyRoutesPage from './pages/MyRoutesPage';
import MyDeliveriesPage from './pages/MyDeliveriesPage';
import RouteDetailsPage from './pages/RouteDetailsPage';
import DeliveryDetailsPage from './pages/DeliveryDetailsPage';
import ProfilePage from './pages/ProfilePage';

// Import contexts
import { Web3ContextProvider } from './contexts/Web3Context';
import AppDataProvider from './contexts/AppDataContext';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <Router>
          <Web3ContextProvider>
            <AppDataProvider>
              <AIProvider>
              <Routes>
                {/* Landing page as the root route */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Other routes with navbar */}
                <Route element={<LayoutWithNavbar />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/find-routes" element={<FindRoutesPage />} />
                  <Route path="/create-route" element={<CreateRoutePage />} />
                  <Route path="/my-routes" element={<MyRoutesPage />} />
                  <Route path="/my-deliveries" element={<MyDeliveriesPage />} />
                  <Route path="/route/:routeId" element={<RouteDetailsPage />} />
                  <Route path="/delivery/:deliveryId" element={<DeliveryDetailsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:address" element={<ProfilePage />} />
                </Route>
              </Routes>
              </AIProvider>
            </AppDataProvider>
          </Web3ContextProvider>
        </Router>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;