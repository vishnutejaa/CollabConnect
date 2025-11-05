import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getPaymentStatus } from '../utils/api';
import { CheckCircle2, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = 2000;

    const poll = async () => {
      try {
        const response = await getPaymentStatus(sessionId);
        setPaymentDetails(response.data);

        if (response.data.payment_status === 'paid') {
          setStatus('success');
        } else if (response.data.status === 'expired') {
          setStatus('failed');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, pollInterval);
        } else {
          setStatus('timeout');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    poll();
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)' }}>
      <div 
        className="max-w-md w-full p-8 rounded-3xl text-center"
        style={{ 
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 105, 92, 0.2)'
        }}
      >
        {status === 'checking' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin" style={{ color: '#00897B' }} />
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
              Processing Payment...
            </h1>
            <p style={{ color: '#00695C' }}>Please wait while we confirm your payment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-6" style={{ color: '#00897B' }} />
            <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
              Payment Successful!
            </h1>
            <p className="mb-6" style={{ color: '#00695C' }}>
              Your payment of ${(paymentDetails?.amount_total / 100).toFixed(2)} has been processed successfully.
            </p>
            <Button 
              data-testid="go-to-dashboard-btn"
              onClick={() => navigate(user.user_type === 'influencer' ? '/dashboard/influencer' : '/dashboard/brand')}
              className="w-full font-semibold py-6"
              style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '12px' }}
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {(status === 'failed' || status === 'error' || status === 'timeout') && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(244, 67, 54, 0.15)' }}>
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>
              Payment {status === 'timeout' ? 'Check Timeout' : 'Failed'}
            </h1>
            <p className="mb-6" style={{ color: '#00695C' }}>
              {status === 'timeout' 
                ? 'Unable to verify payment status. Please check your email for confirmation.'
                : 'There was an issue processing your payment. Please try again.'}
            </p>
            <Button 
              data-testid="go-back-btn"
              onClick={() => navigate(-1)}
              className="w-full font-semibold py-6"
              style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '12px' }}
            >
              Go Back
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;