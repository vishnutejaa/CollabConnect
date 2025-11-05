import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Sparkles, Target, TrendingUp, Shield } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 50%, #80CBC4 100%)' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}></div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#00695C' }}>CollabConnect</h1>
        </div>
        <div className="flex gap-4">
          <Button 
            data-testid="header-login-btn"
            variant="ghost" 
            onClick={() => navigate('/auth')}
            className="font-medium"
            style={{ color: '#00695C' }}
          >
            Login
          </Button>
          <Button 
            data-testid="header-signup-btn"
            onClick={() => navigate('/auth')}
            className="font-semibold px-6"
            style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-20 fade-in">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 
              className="text-5xl lg:text-6xl font-bold mb-6 leading-tight" 
              style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}
            >
              Connect Influencers with Brands That Matter
            </h1>
            <p className="text-lg mb-8" style={{ color: '#00695C', fontWeight: 400 }}>
              AI-powered matchmaking platform that connects social media influencers with brands based on niche, engagement metrics, and audience data.
            </p>
            <div className="flex gap-4">
              <Button 
                data-testid="hero-get-started-btn"
                onClick={() => navigate('/auth')}
                className="font-semibold text-lg px-8 py-6"
                style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
              >
                Get Started Free
              </Button>
              <Button 
                data-testid="hero-learn-more-btn"
                variant="outline" 
                className="font-semibold text-lg px-8 py-6"
                style={{ borderColor: '#00897B', color: '#00897B', borderRadius: '50px', borderWidth: '2px' }}
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div 
              className="rounded-3xl p-8"
              style={{ 
                background: 'rgba(255, 255, 255, 0.6)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 60px rgba(0, 105, 92, 0.15)'
              }}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#004D40' }}>AI Matchmaking</h3>
                    <p style={{ color: '#00695C' }}>Smart algorithm finds perfect brand-influencer pairs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#004D40' }}>Targeted Campaigns</h3>
                    <p style={{ color: '#00695C' }}>Reach your ideal audience with precision</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#004D40' }}>Growth Analytics</h3>
                    <p style={{ color: '#00695C' }}>Track ROI and campaign performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
          Why Choose CollabConnect?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Sparkles, title: 'AI-Powered Matching', desc: 'Get top 10 influencer-brand pairs daily with match scores 0-100' },
            { icon: Shield, title: 'Secure Payments', desc: 'Milestone-based payments with automatic contracts and NDAs' },
            { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Track reach, engagement, conversions, and ROI in real-time' },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl slide-up"
              style={{ 
                background: 'rgba(255, 255, 255, 0.6)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 105, 92, 0.1)',
                animationDelay: `${i * 0.1}s`
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)' }}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#004D40' }}>{feature.title}</h3>
              <p style={{ color: '#00695C' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-8 py-20 text-center">
        <div 
          className="p-12 rounded-3xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 60px rgba(0, 105, 92, 0.15)'
          }}
        >
          <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
            Ready to Transform Your Influencer Marketing?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#00695C' }}>
            Join thousands of brands and influencers already collaborating on CollabConnect
          </p>
          <Button 
            data-testid="cta-get-started-btn"
            onClick={() => navigate('/auth')}
            className="font-semibold text-lg px-12 py-6"
            style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '50px' }}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20" style={{ borderColor: 'rgba(0, 105, 92, 0.2)' }}>
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p style={{ color: '#00695C' }}>© 2024 CollabConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;