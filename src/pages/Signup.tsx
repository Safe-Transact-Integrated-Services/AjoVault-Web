import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedPath } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/api/http';

type Step = 'account' | 'details' | 'security';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<Step>('account');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultAuthenticatedPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handleAccountSubmit = () => {
    if (phone.trim().length >= 8) {
      setError('');
      setStep('details');
    }
  };

  const handleDetailsSubmit = () => {
    if (firstName.trim() && lastName.trim()) {
      setError('');
      setStep('security');
    }
  };

  const handleSecuritySubmit = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signedUpUser = await signup({
        firstName,
        lastName,
        phoneNumber: phone,
        email: email || undefined,
        password,
      });

      navigate(getDefaultAuthenticatedPath(signedUpUser), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'details') {
      setStep('account');
      return;
    }

    if (step === 'security') {
      setStep('details');
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {step === 'account' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Create Account</h1>
                <p className="mt-1 text-muted-foreground">Use the backend identity API credentials format</p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  type="tel"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address (Optional)</Label>
                <Input
                  placeholder="you@example.com"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  type="email"
                  className="h-12"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="h-12 w-full" onClick={handleAccountSubmit} disabled={phone.trim().length < 8}>
                Continue
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Your Details</h1>
                <p className="mt-1 text-muted-foreground">Tell us a bit about yourself</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    placeholder="Adaeze"
                    value={firstName}
                    onChange={event => setFirstName(event.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    placeholder="Okafor"
                    value={lastName}
                    onChange={event => setLastName(event.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="h-12 w-full"
                onClick={handleDetailsSubmit}
                disabled={!firstName.trim() || !lastName.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'security' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Set Password</h1>
                <p className="mt-1 text-muted-foreground">
                  Password must be 8+ characters and include uppercase, lowercase, number, and symbol
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Create a password"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    className="h-12"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="h-12 w-full"
                onClick={handleSecuritySubmit}
                disabled={!password || !confirmPassword || loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Signup;
