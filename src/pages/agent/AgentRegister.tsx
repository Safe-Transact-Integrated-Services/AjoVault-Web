import { useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'form' | 'kyc' | 'success';

const AgentRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (firstName && lastName && phone) setStep('kyc');
  };

  const handleKycSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep('success');
  };

  return (
    <div className="min-h-screen px-5 py-6">
      <button onClick={() => step === 'kyc' ? setStep('form') : step === 'success' ? navigate('/agent') : navigate('/agent')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <h1 className="font-display text-xl font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" /> Register Customer
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Create a new AjoVault account for a customer</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="h-12" />
              </div>
            </div>

            <Button className="w-full h-12" onClick={handleSubmit} disabled={!firstName || !lastName || !phone}>
              Continue to KYC
            </Button>
          </motion.div>
        )}

        {step === 'kyc' && (
          <motion.div key="kyc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <h1 className="font-display text-xl font-bold">Basic KYC</h1>
              <p className="text-sm text-muted-foreground mt-1">Capture customer identity for basic verification</p>
            </div>

            <Card className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">Take a photo of the customer's face for identity verification. This enables Tier 1 access.</p>
              <button className="w-full flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 hover:border-accent transition-colors">
                <Camera className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Tap to take photo</span>
              </button>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Customer Summary</h3>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{firstName} {lastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>
                {gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="font-medium capitalize">{gender}</span></div>}
                {dob && <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span className="font-medium">{dob}</span></div>}
              </div>
            </Card>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> The customer will receive an SMS with their account details and a temporary PIN. They can access their account via USSD (*347*247#) or the mobile app.
            </div>

            <Button className="w-full h-12" onClick={handleKycSubmit} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register Customer'}
            </Button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Account Created!</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {firstName} {lastName}'s account has been created. An SMS with login details has been sent to {phone}.
            </p>
            <Card className="w-full p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">USSD Access</span><span className="font-mono font-semibold">*347*247#</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account Tier</span><span className="font-medium">Tier 1 (Basic)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Daily Limit</span><span className="font-medium">₦50,000</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Your Commission</span><span className="font-semibold text-success">+₦200</span></div>
            </Card>
            <div className="flex gap-3 w-full pt-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => { setStep('form'); setFirstName(''); setLastName(''); setPhone(''); setGender(''); setDob(''); }}>
                Register Another
              </Button>
              <Button className="flex-1 h-12" onClick={() => navigate('/agent')}>Done</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentRegister;
