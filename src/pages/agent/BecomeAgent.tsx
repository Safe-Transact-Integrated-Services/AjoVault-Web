import { useState } from 'react';
import { ArrowLeft, Shield, Upload, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'info' | 'id' | 'review' | 'submitted';

const BecomeAgent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [location, setLocation] = useState('');
  const [idType, setIdType] = useState('');
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (step === 'id') setStep('info');
    else if (step === 'review') setStep('id');
    else navigate('/');
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStep('submitted');
  };

  return (
    <div className="min-h-screen px-5 py-6">
      {step !== 'submitted' && (
        <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="flex flex-col items-center text-center mb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Become an Agent</h1>
              <p className="mt-1 text-sm text-muted-foreground">Join the AjoVault agent network and earn commissions</p>
            </div>

            <Card className="p-4 bg-accent/5 border-accent/20">
              <h3 className="text-sm font-semibold mb-2">Why become an agent?</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Earn commission on every transaction</li>
                <li>• Help your community access financial services</li>
                <li>• Get ₦200 for every customer you register</li>
                <li>• Dedicated support and training</li>
              </ul>
            </Card>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className="h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="e.g. Kano" value={state} onChange={e => setState(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>LGA</Label>
                <Input placeholder="e.g. Kano Municipal" value={lga} onChange={e => setLga(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Business Location</Label>
                <Input placeholder="e.g. Kano Central Market" value={location} onChange={e => setLocation(e.target.value)} className="h-12" />
              </div>
            </div>

            <Button className="w-full h-12" onClick={() => setStep('id')} disabled={!firstName || !lastName || !phone || !state}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'id' && (
          <motion.div key="id" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <h1 className="font-display text-xl font-bold">Identity Verification</h1>
              <p className="text-sm text-muted-foreground mt-1">Upload a valid government-issued ID</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nin">National ID (NIN)</SelectItem>
                    <SelectItem value="drivers">Driver's License</SelectItem>
                    <SelectItem value="voters">Voter's Card</SelectItem>
                    <SelectItem value="passport">International Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upload ID (Front)</Label>
                <button className="w-full flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 hover:border-accent transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to upload photo</span>
                </button>
              </div>

              <div className="space-y-2">
                <Label>Upload ID (Back)</Label>
                <button className="w-full flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 hover:border-accent transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to upload photo</span>
                </button>
              </div>
            </div>

            <Button className="w-full h-12" onClick={() => setStep('review')} disabled={!idType}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Review Application</h1>

            <Card className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{firstName} {lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-medium">{state}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">LGA</span><span className="font-medium">{lga}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{location}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID Type</span><span className="font-medium capitalize">{idType}</span></div>
            </Card>

            <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
              By submitting, you agree to AjoVault's Agent Terms of Service. Your application will be reviewed within 24-48 hours.
            </div>

            <Button className="w-full h-12" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </motion.div>
        )}

        {step === 'submitted' && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Application Submitted!</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your agent application is under review. You'll receive an SMS notification within 24-48 hours.
            </p>
            <Card className="w-full p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Application ID</span><span className="font-mono font-semibold">AJO-APP-{Date.now().toString().slice(-6)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium text-warning">Pending Review</span></div>
            </Card>
            <Button className="w-full h-12" onClick={() => navigate('/')}>Back to Home</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BecomeAgent;
