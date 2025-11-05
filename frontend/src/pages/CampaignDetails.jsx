import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { getCampaign, createApplication } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Users, Target } from 'lucide-react';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const response = await getCampaign(id);
      setCampaign(response.data);
    } catch (error) {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!message.trim()) {
      toast.error('Please add a message');
      return;
    }

    setApplying(true);
    try {
      await createApplication({ campaign_id: id, message });
      toast.success('Application submitted successfully!');
      setMessage('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
        <p style={{ color: '#00695C' }}>Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
        <p style={{ color: '#00695C' }}>Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <Button data-testid="back-btn" variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div 
          className="p-8 rounded-2xl mb-8"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
          }}
        >
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
              {campaign.title}
            </h1>
            <div className="flex items-center gap-3 mb-4">
              <span 
                className="px-4 py-1 rounded-full text-sm font-semibold"
                style={{ 
                  background: campaign.status === 'active' ? 'rgba(0, 137, 123, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  color: campaign.status === 'active' ? '#00897B' : '#666'
                }}
              >
                {campaign.status}
              </span>
              <span className="text-sm" style={{ color: '#00695C' }}>
                Posted {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#004D40' }}>Description</h2>
              <p style={{ color: '#00695C', lineHeight: '1.8' }}>{campaign.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 137, 123, 0.15)' }}>
                  <DollarSign className="w-6 h-6" style={{ color: '#00897B' }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#00695C' }}>Campaign Budget</p>
                  <p className="text-2xl font-bold" style={{ color: '#00897B' }}>${campaign.budget.toLocaleString()}</p>
                </div>
              </div>

              {campaign.target_audience && (
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 137, 123, 0.15)' }}>
                    <Users className="w-6 h-6" style={{ color: '#00897B' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#00695C' }}>Target Audience</p>
                    <p className="font-semibold" style={{ color: '#004D40' }}>{campaign.target_audience}</p>
                  </div>
                </div>
              )}
            </div>

            {campaign.niche_tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5" style={{ color: '#00897B' }} />
                  <h3 className="font-bold" style={{ color: '#004D40' }}>Niche Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaign.niche_tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{ background: 'rgba(0, 137, 123, 0.15)', color: '#00897B' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apply Section */}
        <div 
          className="p-8 rounded-2xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Apply to this Campaign</h2>
          <Textarea
            data-testid="application-message-input"
            placeholder="Tell the brand why you're a great fit for this campaign..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="mb-4"
          />
          <Button 
            data-testid="submit-application-btn"
            onClick={handleApply}
            disabled={applying}
            className="w-full font-semibold py-6"
            style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '12px' }}
          >
            {applying ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;