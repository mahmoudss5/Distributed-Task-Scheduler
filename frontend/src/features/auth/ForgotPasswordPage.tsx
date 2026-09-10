import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Send, Loader2, ArrowLeft } from 'lucide-react';
import axiosInstance from '../../shared/api/axiosInstance';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await axiosInstance.post('/users/forgot-password', { email });
      // Pass the email to the reset page via state
      navigate('/reset-password', { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-800">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-slate-400">Enter your email to receive an OTP code</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send OTP
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
