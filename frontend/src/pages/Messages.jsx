import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';

const Messages = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Button data-testid="back-btn" variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="text-center py-20">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)' }}
          >
            <MessageSquare className="w-10 h-10" style={{ color: '#00897B' }} />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
            Messages
          </h1>
          <p style={{ color: '#00695C' }}>
            Direct messaging feature coming soon! You'll be able to chat with brands and influencers here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Messages;