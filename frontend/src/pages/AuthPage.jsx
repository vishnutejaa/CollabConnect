import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { register, login } from '../utils/api';
import { UserCircle, Building2 } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('influencer');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      user_type: userType,
    };

    try {
      const response = await register(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Account created successfully!');
      navigate(userType === 'influencer' ? '/dashboard/influencer' : '/dashboard/brand');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const response = await login(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Welcome back!');
      navigate(response.data.user.user_type === 'influencer' ? '/dashboard/influencer' : '/dashboard/brand');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 50%, #80CBC4 100%)' }}>
      <div 
        className="w-full max-w-md p-8 rounded-3xl"
        style={{ 
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 20px 60px rgba(0, 105, 92, 0.2)'
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#004D40' }}>Welcome to CollabConnect</h1>
          <p style={{ color: '#00695C' }}>Join the future of influencer marketing</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger data-testid="login-tab" value="login">Login</TabsTrigger>
            <TabsTrigger data-testid="signup-tab" value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form data-testid="login-form" onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input data-testid="login-email-input" id="login-email" name="email" type="email" required placeholder="your@email.com" />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input data-testid="login-password-input" id="login-password" name="password" type="password" required placeholder="••••••••" />
              </div>
              <Button 
                data-testid="login-submit-btn"
                type="submit" 
                disabled={loading} 
                className="w-full font-semibold py-6"
                style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '12px' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">I am a...</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    data-testid="user-type-influencer"
                    onClick={() => setUserType('influencer')}
                    className="p-6 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: userType === 'influencer' ? 'linear-gradient(135deg, #00897B, #26A69A)' : 'rgba(255, 255, 255, 0.5)',
                      border: `2px solid ${userType === 'influencer' ? '#00897B' : 'transparent'}`,
                      color: userType === 'influencer' ? 'white' : '#00695C'
                    }}
                  >
                    <UserCircle className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-center font-semibold">Influencer</p>
                  </div>
                  <div 
                    data-testid="user-type-brand"
                    onClick={() => setUserType('brand')}
                    className="p-6 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: userType === 'brand' ? 'linear-gradient(135deg, #00897B, #26A69A)' : 'rgba(255, 255, 255, 0.5)',
                      border: `2px solid ${userType === 'brand' ? '#00897B' : 'transparent'}`,
                      color: userType === 'brand' ? 'white' : '#00695C'
                    }}
                  >
                    <Building2 className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-center font-semibold">Brand</p>
                  </div>
                </div>
              </div>

              <form data-testid="signup-form" onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input data-testid="signup-email-input" id="signup-email" name="email" type="email" required placeholder="your@email.com" />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input data-testid="signup-password-input" id="signup-password" name="password" type="password" required placeholder="••••••••" minLength={6} />
                </div>
                <Button 
                  data-testid="signup-submit-btn"
                  type="submit" 
                  disabled={loading} 
                  className="w-full font-semibold py-6"
                  style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white', borderRadius: '12px' }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;