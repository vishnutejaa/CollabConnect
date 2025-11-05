import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Influencers
export const getInfluencers = (niche) => api.get('/influencers', { params: { niche } });
export const getInfluencer = (id) => api.get(`/influencers/${id}`);
export const updateInfluencerProfile = (data) => api.put('/influencers/profile', data);

// Brands
export const getBrand = (id) => api.get(`/brands/${id}`);
export const updateBrandProfile = (data) => api.put('/brands/profile', data);

// Campaigns
export const createCampaign = (data) => api.post('/campaigns', data);
export const getCampaigns = (params) => api.get('/campaigns', { params });
export const getCampaign = (id) => api.get(`/campaigns/${id}`);
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}`, data);
export const getCampaignApplications = (id) => api.get(`/campaigns/${id}/applications`);

// Matches
export const generateMatches = () => api.post('/matches/generate');
export const getInfluencerMatches = () => api.get('/matches/influencer');
export const getBrandMatches = () => api.get('/matches/brand');

// Applications
export const createApplication = (data) => api.post('/applications', data);
export const updateApplicationStatus = (id, status) => api.put(`/applications/${id}/status`, { status });

// Messages
export const sendMessage = (data) => api.post('/messages', data);
export const getConversation = (campaignId) => api.get(`/messages/conversation/${campaignId}`);

// Payments
export const createPaymentIntent = (data) => api.post('/payments/create-payment-intent', data);
export const getPaymentStatus = (sessionId) => api.get(`/payments/status/${sessionId}`);
export const getTransactions = () => api.get('/payments/transactions');

// Analytics
export const getCampaignAnalytics = (id) => api.get(`/analytics/campaign/${id}`);
export const getInfluencerGrowth = () => api.get('/analytics/influencer/growth');

export default api;