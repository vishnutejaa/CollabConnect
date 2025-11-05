import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getInfluencerGrowth } from '../utils/api';
import { ArrowLeft, TrendingUp, Users, Target, DollarSign } from 'lucide-react';

const Analytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      if (user.user_type === 'influencer') {
        const response = await getInfluencerGrowth();
        setAnalytics(response.data);
      } else {
        // Mock brand analytics
        setAnalytics({
          total_reach: 1200000,
          total_engagement: 85000,
          campaigns_run: 5,
          avg_roi: 3.5
        });
      }
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Button data-testid="back-btn" variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Analytics Dashboard</h1>
          <p style={{ color: '#00695C' }}>Track your performance and growth</p>
        </div>

        {loading ? (
          <p className="text-center" style={{ color: '#00695C' }}>Loading analytics...</p>
        ) : (
          <div>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {user.user_type === 'influencer' ? (
                <>
                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.7)', 
                      backdropFilter: 'blur(16px)',
                      boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-6 h-6" style={{ color: '#00897B' }} />
                      <span className="font-medium" style={{ color: '#00695C' }}>Engagement Rate</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{analytics?.engagement_rate}%</p>
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
                      <Target className="w-6 h-6" style={{ color: '#00897B' }} />
                      <span className="font-medium" style={{ color: '#00695C' }}>Collaborations</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{analytics?.collaborations_count}</p>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.7)', 
                      backdropFilter: 'blur(16px)',
                      boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-6 h-6" style={{ color: '#00897B' }} />
                      <span className="font-medium" style={{ color: '#00695C' }}>Total Reach</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{analytics?.total_reach?.toLocaleString()}</p>
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
                      <TrendingUp className="w-6 h-6" style={{ color: '#00897B' }} />
                      <span className="font-medium" style={{ color: '#00695C' }}>Engagement</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{analytics?.total_engagement?.toLocaleString()}</p>
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
                      <Target className="w-6 h-6" style={{ color: '#00897B' }} />
                      <span className="font-medium" style={{ color: '#00695C' }}>Campaigns</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{analytics?.campaigns_run}</p>
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
                      <DollarSign className="w-6 h-6" style={{ color: '#00897B' }} />
                      <span className="font-medium" style={{ color: '#00695C' }}>Avg ROI</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#004D40' }}>{analytics?.avg_roi}x</p>
                  </div>
                </>
              )}
            </div>

            {/* Growth Chart (Mock) */}
            {user.user_type === 'influencer' && analytics?.follower_growth && (
              <div 
                className="p-8 rounded-2xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
                }}
              >
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Follower Growth</h2>
                <div className="space-y-4">
                  {analytics.follower_growth.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-16 font-semibold" style={{ color: '#00695C' }}>{item.month}</span>
                      <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(0, 137, 123, 0.15)' }}>
                        <div 
                          className="h-full rounded-lg transition-all"
                          style={{ 
                            width: `${(item.followers / 150000) * 100}%`,
                            background: 'linear-gradient(135deg, #00897B, #26A69A)'
                          }}
                        ></div>
                      </div>
                      <span className="w-24 text-right font-bold" style={{ color: '#004D40' }}>{item.followers.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;