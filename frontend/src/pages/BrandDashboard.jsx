import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { getMe, getCampaigns, createCampaign, getBrandMatches, generateMatches } from '../utils/api';
import { toast } from 'sonner';
import { Plus, Target, TrendingUp, Users, LogOut } from 'lucide-react';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [meRes, campaignsRes, matchesRes] = await Promise.all([
        getMe(),
        getCampaigns(),
        getBrandMatches()
      ]);
      setUser(meRes.data);
      const myCampaigns = campaignsRes.data.filter(c => c.brand_id === meRes.data.id);
      setCampaigns(myCampaigns);
      setMatches(matchesRes.data);
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

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      budget: parseFloat(formData.get('budget')),
      target_audience: formData.get('target_audience'),
      niche_tags: formData.get('niche_tags').split(',').map(t => t.trim()),
    };

    try {
      await createCampaign(data);
      toast.success('Campaign created successfully!');
      setDialogOpen(false);
      loadDashboard();
    } catch (error) {
      toast.error('Failed to create campaign');
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
            <Button data-testid="nav-campaigns-btn" variant="ghost" onClick={() => navigate('/campaigns')}>Browse Influencers</Button>
            <Button data-testid="nav-matches-btn" variant="ghost" onClick={() => navigate('/matches')}>Matches</Button>
            <Button data-testid="nav-messages-btn" variant="ghost" onClick={() => navigate('/messages')}>Messages</Button>
            <Button data-testid="nav-analytics-btn" variant="ghost" onClick={() => navigate('/analytics')}>Analytics</Button>
            <Button data-testid="logout-btn" variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Brand Dashboard</h1>
            <p style={{ color: '#00695C' }}>Manage your campaigns and find the perfect influencers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="create-campaign-btn"
                className="font-semibold"
                style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <form data-testid="create-campaign-form" onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input data-testid="campaign-title-input" id="title" name="title" required placeholder="Summer Collection Launch" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea data-testid="campaign-description-input" id="description" name="description" required placeholder="Describe your campaign..." />
                </div>
                <div>
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input data-testid="campaign-budget-input" id="budget" name="budget" type="number" required placeholder="5000" />
                </div>
                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Input data-testid="campaign-audience-input" id="target_audience" name="target_audience" placeholder="18-35 year olds interested in fashion" />
                </div>
                <div>
                  <Label htmlFor="niche_tags">Niche Tags (comma-separated)</Label>
                  <Input data-testid="campaign-tags-input" id="niche_tags" name="niche_tags" placeholder="fashion, lifestyle, beauty" />
                </div>
                <Button data-testid="campaign-submit-btn" type="submit" className="w-full" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white' }}>
                  Create Campaign
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              <span className="font-medium" style={{ color: '#00695C' }}>Active Campaigns</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{campaigns.filter(c => c.status === 'active').length}</p>
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
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium" style={{ color: '#00695C' }}>Influencer Matches</span>
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
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium" style={{ color: '#00695C' }}>Total Budget</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#004D40' }}>${campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Your Campaigns */}
        <div 
          className="p-8 rounded-2xl mb-8"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Your Campaigns</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
                style={{ borderColor: 'rgba(0, 137, 123, 0.2)', background: 'rgba(255, 255, 255, 0.5)' }}
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold" style={{ color: '#004D40' }}>{campaign.title}</h3>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      background: campaign.status === 'active' ? 'rgba(0, 137, 123, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                      color: campaign.status === 'active' ? '#00897B' : '#666'
                    }}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="mb-4" style={{ color: '#00695C' }}>{campaign.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: '#00897B' }}>Budget: ${campaign.budget.toLocaleString()}</span>
                  <span className="text-sm" style={{ color: '#00695C' }}>{campaign.niche_tags.join(', ')}</span>
                </div>
              </div>
            ))}

            {campaigns.length === 0 && (
              <p className="text-center col-span-2 py-8" style={{ color: '#00695C' }}>No campaigns yet. Create your first campaign!</p>
            )}
          </div>
        </div>

        {/* AI Matches */}
        <div 
          className="p-8 rounded-2xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Recommended Influencers</h2>
              <p style={{ color: '#00695C' }}>AI-matched influencers for your campaigns</p>
            </div>
            <Button 
              data-testid="generate-matches-btn"
              onClick={handleGenerateMatches}
              className="font-semibold"
              style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
            >
              Find Influencers
            </Button>
          </div>

          <div className="space-y-4">
            {matches.slice(0, 5).map((match) => (
              <div 
                key={match.id} 
                className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
                style={{ borderColor: 'rgba(0, 137, 123, 0.2)', background: 'rgba(255, 255, 255, 0.5)' }}
                onClick={() => navigate(`/influencers/${match.influencer_id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold" style={{ color: '#004D40' }}>Influencer Match</span>
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
              <p className="text-center py-8" style={{ color: '#00695C' }}>No matches yet. Create a campaign and click "Find Influencers"!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDashboard;