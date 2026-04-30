import { type FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { validateLoginIdentifier } from '@/lib/authFormValidation';
import { forgotPin } from '@/services/authApi';
import AuthLayout from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';

interface ForgotPinLocationState {
  identifier?: string;
}

const ForgotPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ForgotPinLocationState | null;
  const [identifier, setIdentifier] = useState(() => locationState?.identifier ?? '');
  const [identifierError, setIdentifierError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextIdentifierError = validateLoginIdentifier(identifier);
    setIdentifierError(nextIdentifierError);
    setError('');

    if (nextIdentifierError) {
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPin(identifier);
      setMessage(response.message);
      setDebugOtp(response.debugOtp?.trim() ?? '');
      setSubmitted(true);
      toast.success(response.message);
    } catch (err) {
      const nextError = getApiErrorMessage(err, 'Unable to request a PIN reset right now.');
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
            <h1 className="font-display text-3xl font-bold text-[#102A56]">Forgot PIN</h1>
            <p className="mt-2 text-muted-foreground">Enter your phone number or email to receive a 6-digit reset code.</p>
          </div>

          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-semibold text-[#102A56]">Phone Number or Email</Label>
                <Input
                  id="identifier"
                  placeholder="0800 000 0000 or you@example.com"
                  value={identifier}
                  onChange={event => {
                    setIdentifier(event.target.value);
                    if (identifierError) {
                      setIdentifierError('');
                    }
                    if (error) {
                      setError('');
                    }
                  }}
                  onBlur={() => setIdentifierError(validateLoginIdentifier(identifier))}
                  className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                  aria-invalid={!!identifierError}
                />
                {identifierError && <p className="text-xs text-destructive">{identifierError}</p>}
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

              <Button 
                type="submit" 
                className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset code'}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
              {debugOtp && (
                <div className="space-y-3 rounded-xl bg-[#F8FAFC] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">Development reset OTP</p>
                  <p className="font-mono text-xl font-bold tracking-[0.2em] text-[#102A56]">{debugOtp}</p>
                </div>
              )}
              <Button
                className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20"
                onClick={() => navigate('/reset-pin', { state: { identifier, otp: debugOtp } })}
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

export default ForgotPin;
