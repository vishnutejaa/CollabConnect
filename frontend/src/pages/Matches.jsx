import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getInfluencerMatches, getBrandMatches, generateMatches } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';

const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = user.user_type === 'influencer' 
        ? await getInfluencerMatches() 
        : await getBrandMatches();
      setMatches(response.data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    setGenerating(true);
    try {
      const response = await generateMatches();
      setMatches(response.data.matches);
      toast.success(`Generated ${response.data.count} new matches!`);
    } catch (error) {
      toast.error('Failed to generate matches');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Button data-testid="back-btn" variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>AI-Powered Matches</h1>
            <p style={{ color: '#00695C' }}>Discover your perfect {user.user_type === 'influencer' ? 'campaigns' : 'influencers'}</p>
          </div>
          <Button 
            data-testid="generate-matches-btn"
            onClick={handleGenerateMatches}
            disabled={generating}
            className="font-semibold"
            style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate New Matches'}
          </Button>
        </div>

        {loading ? (
          <p className="text-center" style={{ color: '#00695C' }}>Loading matches...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {matches.map((match) => (
              <div
                key={match.id}
                data-testid={`match-card-${match.id}`}
                className="p-6 rounded-2xl cursor-pointer transition-all hover:shadow-xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
                }}
                onClick={() => navigate(
                  user.user_type === 'influencer' 
                    ? `/campaigns/${match.campaign_id}` 
                    : `/influencers/${match.influencer_id}`
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold" style={{ color: '#004D40' }}>
                    {user.user_type === 'influencer' ? 'Campaign Match' : 'Influencer Match'}
                  </h3>
                  <span 
                    className="px-4 py-2 rounded-full font-bold text-lg"
                    style={{ 
                      background: match.match_score >= 80 
                        ? 'linear-gradient(135deg, #00897B, #26A69A)'
                        : match.match_score >= 60
                        ? 'rgba(0, 137, 123, 0.3)'
                        : 'rgba(0, 137, 123, 0.15)',
                      color: match.match_score >= 80 ? 'white' : '#00897B'
                    }}
                  >
                    {match.match_score}%
                  </span>
                </div>

                <p style={{ color: '#00695C', lineHeight: '1.6' }}>{match.ai_explanation}</p>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0, 137, 123, 0.2)' }}>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: '#00897B' }}
                  >
                    {match.match_score >= 80 ? 'Highly Recommended' : match.match_score >= 60 ? 'Good Match' : 'Potential Match'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#00897B' }} />
            <p className="text-xl mb-4" style={{ color: '#004D40' }}>No matches yet</p>
            <p className="mb-6" style={{ color: '#00695C' }}>Click "Generate New Matches" to discover perfect matches!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;