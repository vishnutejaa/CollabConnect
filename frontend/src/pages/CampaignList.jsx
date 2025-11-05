import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getCampaigns } from '../utils/api';
import { Search, DollarSign, Users, ArrowLeft } from 'lucide-react';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = campaigns.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.niche_tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCampaigns(filtered);
    } else {
      setFilteredCampaigns(campaigns);
    }
  }, [searchTerm, campaigns]);

  const loadCampaigns = async () => {
    try {
      const response = await getCampaigns({ status: 'active' });
      setCampaigns(response.data);
      setFilteredCampaigns(response.data);
    } catch (error) {
      console.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <Button data-testid="back-btn" variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Active Campaigns</h1>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#00695C' }} />
            <Input
              data-testid="search-campaigns-input"
              type="text"
              placeholder="Search campaigns by title, description, or niche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6"
              style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '50px' }}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center" style={{ color: '#00695C' }}>Loading campaigns...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                data-testid={`campaign-card-${campaign.id}`}
                className="p-6 rounded-2xl cursor-pointer transition-all hover:shadow-xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
                }}
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#004D40' }}>{campaign.title}</h3>
                  <p className="text-sm line-clamp-3" style={{ color: '#00695C' }}>{campaign.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: '#00897B' }} />
                    <span className="font-semibold" style={{ color: '#00897B' }}>Budget: ${campaign.budget.toLocaleString()}</span>
                  </div>

                  {campaign.target_audience && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" style={{ color: '#00695C' }} />
                      <span className="text-sm" style={{ color: '#00695C' }}>{campaign.target_audience}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {campaign.niche_tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(0, 137, 123, 0.15)', color: '#00897B' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCampaigns.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl" style={{ color: '#00695C' }}>No campaigns found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignList;