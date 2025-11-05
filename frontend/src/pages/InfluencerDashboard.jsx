import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getMe, getInfluencerMatches, generateMatches, getTransactions } from '../utils/api';
import { toast } from 'sonner';
import { Sparkles, TrendingUp, DollarSign, Target, LogOut } from 'lucide-react';

const InfluencerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [meRes, matchesRes, txRes] = await Promise.all([
        getMe(),
        getInfluencerMatches(),
        getTransactions()
      ]);
      setUser(meRes.data);
      setProfile(meRes.data.profile);
      setMatches(matchesRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/auth');
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    try {
      const response = await generateMatches();
      setMatches(response.data.matches);
      toast.success(`Generated ${response.data.count} new matches!`);
    } catch (error) {
      toast.error('Failed to generate matches');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
        <p className="text-xl" style={{ color: '#00695C' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'rgba(0, 105, 92, 0.2)', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}></div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#00695C' }}>CollabConnect</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button data-testid="nav-campaigns-btn" variant="ghost" onClick={() => navigate('/campaigns')}>Campaigns</Button>
            <Button data-testid="nav-matches-btn" variant="ghost" onClick={() => navigate('/matches')}>Matches</Button>
            <Button data-testid="nav-messages-btn" variant="ghost" onClick={() => navigate('/messages')}>Messages</Button>
            <Button data-testid="nav-analytics-btn" variant="ghost" onClick={() => navigate('/analytics')}>Analytics</Button>
            <Button data-testid="logout-btn" variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Welcome back, {user?.email.split('@')[0]}!</h1>
          <p style={{ color: '#00695C' }}>Here's what's happening with your collaborations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.7)', 
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium" style={{ color: '#00695C' }}>Followers</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{profile?.follower_count?.toLocaleString() || '0'}</p>
          </div>

          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.7)', 
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium" style={{ color: '#00695C' }}>Engagement</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{profile?.engagement_rate || '0'}%</p>
          </div>

          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.7)', 
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium" style={{ color: '#00695C' }}>Matches</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{matches.length}</p>
          </div>

          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.7)', 
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium" style={{ color: '#00695C' }}>Pricing</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#004D40' }}>${profile?.pricing?.toLocaleString() || '0'}</p>
          </div>
        </div>

        {/* AI Matchmaking Section */}
        <div 
          className="p-8 rounded-2xl mb-8"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>AI-Powered Matches</h2>
              <p style={{ color: '#00695C' }}>Discover campaigns that match your niche and audience</p>
            </div>
            <Button 
              data-testid="generate-matches-btn"
              onClick={handleGenerateMatches}
              className="font-semibold"
              style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
            >
              Generate New Matches
            </Button>
          </div>

          <div className="space-y-4">
            {matches.slice(0, 5).map((match) => (
              <div 
                key={match.id} 
                className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
                style={{ borderColor: 'rgba(0, 137, 123, 0.2)', background: 'rgba(255, 255, 255, 0.5)' }}
                onClick={() => navigate(`/campaigns/${match.campaign_id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold" style={{ color: '#004D40' }}>Campaign Match</span>
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ 
                          background: match.match_score >= 80 ? 'rgba(0, 137, 123, 0.2)' : 'rgba(0, 137, 123, 0.1)',
                          color: '#00897B'
                        }}
                      >
                        {match.match_score}% Match
                      </span>
                    </div>
                    <p style={{ color: '#00695C' }}>{match.ai_explanation}</p>
                  </div>
                </div>
              </div>
            ))}

            {matches.length === 0 && (
              <p className="text-center py-8" style={{ color: '#00695C' }}>No matches yet. Click "Generate New Matches" to find campaigns!</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div 
          className="p-8 rounded-2xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 rounded-xl border flex justify-between items-center"
                style={{ borderColor: 'rgba(0, 137, 123, 0.2)', background: 'rgba(255, 255, 255, 0.5)' }}
              >
                <div>
                  <p className="font-semibold" style={{ color: '#004D40' }}>{tx.milestone_description || 'Campaign Payment'}</p>
                  <p className="text-sm" style={{ color: '#00695C' }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg" style={{ color: '#00897B' }}>${tx.amount.toFixed(2)}</p>
                  <span 
                    className="text-sm px-2 py-1 rounded"
                    style={{ 
                      background: tx.status === 'completed' ? 'rgba(0, 137, 123, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                      color: tx.status === 'completed' ? '#00897B' : '#FF9800'
                    }}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <p className="text-center py-8" style={{ color: '#00695C' }}>No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerDashboard;