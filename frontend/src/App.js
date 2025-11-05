import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import InfluencerDashboard from './pages/InfluencerDashboard';
import BrandDashboard from './pages/BrandDashboard';
import CampaignList from './pages/CampaignList';
import CampaignDetails from './pages/CampaignDetails';
import InfluencerProfile from './pages/InfluencerProfile';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import PaymentSuccess from './pages/PaymentSuccess';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard/influencer" element={<InfluencerDashboard />} />
            <Route path="/dashboard/brand" element={<BrandDashboard />} />
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaigns/:id" element={<CampaignDetails />} />
            <Route path="/influencers/:id" element={<InfluencerProfile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<Navigate to="/campaigns" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </div>
    </ErrorBoundary>
  );
}

export default App;