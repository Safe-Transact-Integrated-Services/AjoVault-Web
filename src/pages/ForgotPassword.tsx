import { type FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { validateEmailAddress } from '@/lib/authFormValidation';
import { forgotPassword } from '@/services/authApi';
import AuthLayout from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';

interface ForgotPasswordLocationState {
  email?: string;
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ForgotPasswordLocationState | null;
  const [email, setEmail] = useState(() => locationState?.email ?? '');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugResetToken, setDebugResetToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEmailError = validateEmailAddress(email);
    setEmailError(nextEmailError);
    setError('');

    if (nextEmailError) {
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      setDebugResetToken(response.debugResetToken?.trim() ?? '');
      setSubmitted(true);
      toast.success(response.message);
    } catch (err) {
      const nextError = getApiErrorMessage(err, 'Unable to request a password reset right now.');
      setError(nextError);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative">
        <button
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to login
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-[#102A56]">Forgot Password</h1>
            <p className="mt-2 text-muted-foreground">Enter your email address and we’ll help you reset your password.</p>
          </div>

          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#102A56]">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={event => {
                    setEmail(event.target.value);
                    if (emailError) {
                      setEmailError('');
                    }
                    if (error) {
                      setError('');
                    }
                  }}
                  onBlur={() => setEmailError(validateEmailAddress(email))}
                  className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                  aria-invalid={!!emailError}
                />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

              <Button 
                type="submit" 
                className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
              {debugResetToken && (
                <div className="space-y-3 rounded-xl bg-[#F8FAFC] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">Development reset token</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">{debugResetToken}</p>
                </div>
              )}
              <Button
                className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20"
                onClick={() => navigate('/reset-password', { state: { token: debugResetToken } })}
              >
                Continue
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
