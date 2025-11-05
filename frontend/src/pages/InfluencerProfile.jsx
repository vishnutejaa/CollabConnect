import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getInfluencer } from '../utils/api';
import { ArrowLeft, Users, TrendingUp, DollarSign, Instagram, Youtube } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';

const InfluencerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const response = await getInfluencer(id);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
        <p style={{ color: '#00695C' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
        <p style={{ color: '#00695C' }}>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div className="max-w-5xl mx-auto px-8 py-8">
        <Button data-testid="back-btn" variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-1">
            <div 
              className="p-6 rounded-2xl mb-6 text-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)', 
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
              }}
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}></div>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Influencer Profile</h1>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {profile.niche_tags.map((tag, i) => (
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

            {/* Stats */}
            <div 
              className="p-6 rounded-2xl space-y-4"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)', 
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" style={{ color: '#00897B' }} />
                  <span className="text-sm font-medium" style={{ color: '#00695C' }}>Total Followers</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#004D40' }}>{profile.follower_count.toLocaleString()}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" style={{ color: '#00897B' }} />
                  <span className="text-sm font-medium" style={{ color: '#00695C' }}>Engagement Rate</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#004D40' }}>{profile.engagement_rate}%</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5" style={{ color: '#00897B' }} />
                  <span className="text-sm font-medium" style={{ color: '#00695C' }}>Pricing</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#004D40' }}>${profile.pricing.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <div 
              className="p-6 rounded-2xl"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)', 
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold mb-3" style={{ color: '#004D40' }}>About</h2>
              <p style={{ color: '#00695C', lineHeight: '1.8' }}>{profile.bio || 'No bio available'}</p>
            </div>

            {/* Social Profiles */}
            <div 
              className="p-6 rounded-2xl"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)', 
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: '#004D40' }}>Social Profiles</h2>
              <div className="space-y-4">
                {profile.social_profiles?.instagram && (
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(0, 137, 123, 0.1)' }}>
                    <div className="flex items-center gap-3">
                      <Instagram className="w-6 h-6" style={{ color: '#00897B' }} />
                      <div>
                        <p className="font-semibold" style={{ color: '#004D40' }}>{profile.social_profiles.instagram.username}</p>
                        <p className="text-sm" style={{ color: '#00695C' }}>{profile.social_profiles.instagram.followers?.toLocaleString()} followers</p>
                      </div>
                    </div>
                  </div>
                )}

                {profile.social_profiles?.tiktok && (
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(0, 137, 123, 0.1)' }}>
                    <div className="flex items-center gap-3">
                      <SiTiktok className="w-6 h-6" style={{ color: '#00897B' }} />
                      <div>
                        <p className="font-semibold" style={{ color: '#004D40' }}>{profile.social_profiles.tiktok.username}</p>
                        <p className="text-sm" style={{ color: '#00695C' }}>{profile.social_profiles.tiktok.followers?.toLocaleString()} followers</p>
                      </div>
                    </div>
                  </div>
                )}

                {profile.social_profiles?.youtube && (
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(0, 137, 123, 0.1)' }}>
                    <div className="flex items-center gap-3">
                      <Youtube className="w-6 h-6" style={{ color: '#00897B' }} />
                      <div>
                        <p className="font-semibold" style={{ color: '#004D40' }}>{profile.social_profiles.youtube.username}</p>
                        <p className="text-sm" style={{ color: '#00695C' }}>{profile.social_profiles.youtube.subscribers?.toLocaleString()} subscribers</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <div 
                className="p-6 rounded-2xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)'
                }}
              >
                <h2 className="text-xl font-bold mb-4" style={{ color: '#004D40' }}>Portfolio</h2>
                <div className="space-y-2">
                  {profile.portfolio.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(0, 137, 123, 0.1)' }}>
                      <p style={{ color: '#00695C' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerProfile;