import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, Eye, FileText, Shield, Upload, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAgentPortalState, submitAgentApplication, type AgentPortalState } from '@/services/agentApi';
import { getApiErrorMessage } from '@/lib/api/http';

type Step = 'info' | 'id' | 'review' | 'submitted';
const maxAgentDocumentSizeBytes = 1_200_000;

const BecomeAgent = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitializing } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>('info');
  const [portalState, setPortalState] = useState<AgentPortalState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [locationText, setLocationText] = useState('');
  const [idType, setIdType] = useState('');
  const [idDocumentName, setIdDocumentName] = useState('');
  const [idDocumentDataUrl, setIdDocumentDataUrl] = useState('');

  useEffect(() => {
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    const [initialFirstName, ...remainingNames] = fullName.split(/\s+/).filter(Boolean);

    if (!firstName && initialFirstName) {
      setFirstName(initialFirstName);
    }

    if (!lastName && remainingNames.length > 0) {
      setLastName(remainingNames.join(' '));
    }

    if (!phone && user?.phone) {
      setPhone(user.phone);
    }
  }, [firstName, lastName, phone, user]);

  useEffect(() => {
    let active = true;

    if (isInitializing) {
      return undefined;
    }

    if (!isAuthenticated) {
      setLoadingState(false);
      setPortalState(null);
      return undefined;
    }

    const loadPortalState = async () => {
      try {
        const nextState = await getMyAgentPortalState();
        if (!active) {
          return;
        }

        setPortalState(nextState);

        const application = nextState.application;
        if (application) {
          const [applicationFirstName, ...applicationLastName] = application.fullName.split(/\s+/).filter(Boolean);
          setFirstName(applicationFirstName ?? '');
          setLastName(applicationLastName.join(' '));
          setPhone(application.phoneNumber);
          setState(application.state);
          setLga(application.lga ?? '');
          setLocationText(application.location);
          setIdType(application.idType);
          setIdDocumentName(application.idDocumentName ?? '');
          setIdDocumentDataUrl(application.idDocumentDataUrl ?? '');
        }

        if (nextState.profile || application?.status === 'pending' || application?.status === 'approved') {
          setStep('submitted');
        }
      } catch {
        if (active) {
          setPortalState(null);
        }
      } finally {
        if (active) {
          setLoadingState(false);
        }
      }
    };

    void loadPortalState();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isInitializing]);

  const isApproved = !!portalState?.profile;
  const isRejected = portalState?.application?.status === 'rejected';

  const goBack = () => {
    if (step === 'id') {
      setStep('info');
      return;
    }

    if (step === 'review') {
      setStep('id');
      return;
    }

    if (step === 'submitted' && isRejected) {
      setStep('info');
      return;
    }

    navigate('/');
  };

  const handleDocumentSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Only image and PDF documents are supported.');
      event.target.value = '';
      return;
    }

    if (file.size > maxAgentDocumentSizeBytes) {
      setError('Document is too large. Keep it below 1.2 MB.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setIdDocumentName(file.name);
      setIdDocumentDataUrl(dataUrl);
      setError('');
    } catch {
      setError('Unable to read the selected document.');
    } finally {
      event.target.value = '';
    }
  };

  const clearDocument = () => {
    setIdDocumentName('');
    setIdDocumentDataUrl('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/agent/apply' } } });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const nextState = await submitAgentApplication({
        firstName,
        lastName,
        phoneNumber: phone,
        state,
        lga,
        location: locationText,
        idType: idType as 'nin' | 'drivers' | 'voters' | 'passport',
        idDocumentName,
        idDocumentDataUrl,
      });

      setPortalState(nextState);
      setStep('submitted');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to submit your agent application.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isInitializing || loadingState) {
    return (
      <div className="min-h-screen px-4 py-6 safe-top pb-10">
        <p className="text-sm text-muted-foreground">Loading agent application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-10">
      {step !== 'submitted' && (
        <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="mb-2 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Become an Agent</h1>
              <p className="mt-1 text-sm text-muted-foreground">Join the AjoVault agent network and earn commissions</p>
            </div>

            <Card className="border-accent/20 bg-accent/5 p-4">
              <h3 className="mb-2 text-sm font-semibold">Why become an agent?</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>Earn commission on assisted transactions</li>
                <li>Help your community access AjoVault services</li>
                <li>Register customers and support onboarding</li>
                <li>Get reviewed and activated by the super-admin team</li>
              </ul>
            </Card>

            {!isAuthenticated && (
              <Card className="border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground">
                Sign in with your normal AjoVault account before submitting this application. You can still fill the form now.
              </Card>
            )}

            {isRejected && portalState?.application?.reviewNote && (
              <Card className="border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                Last review note: {portalState.application.reviewNote}
              </Card>
            )}

              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input placeholder="First name" value={firstName} onChange={event => setFirstName(event.target.value)} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Last name" value={lastName} onChange={event => setLastName(event.target.value)} className="h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+234 800 000 0000" value={phone} onChange={event => setPhone(event.target.value)} type="tel" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="e.g. Kano" value={state} onChange={event => setState(event.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>LGA</Label>
                <Input placeholder="e.g. Kano Municipal" value={lga} onChange={event => setLga(event.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Business Location</Label>
                <Input placeholder="e.g. Kano Central Market" value={locationText} onChange={event => setLocationText(event.target.value)} className="h-12" />
              </div>
            </div>

            <Button className="h-12 w-full" onClick={() => setStep('id')} disabled={!firstName || !lastName || !phone || !state || !locationText}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'id' && (
          <motion.div key="id" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <h1 className="font-display text-xl font-bold">Identity Verification</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose the ID type you will submit for review.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nin">National ID (NIN)</SelectItem>
                    <SelectItem value="drivers">Driver&apos;s License</SelectItem>
                    <SelectItem value="voters">Voter&apos;s Card</SelectItem>
                    <SelectItem value="passport">International Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="space-y-2 p-4 text-xs text-muted-foreground">
                <p>Upload a clear image or PDF of the identification document you selected.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={event => void handleDocumentSelected(event)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                >
                  {idDocumentDataUrl ? <FileText className="h-8 w-8 text-accent" /> : <Upload className="h-8 w-8" />}
                  <span>{idDocumentDataUrl ? 'Replace uploaded document' : 'Tap to upload document'}</span>
                </button>
                {idDocumentDataUrl && (
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{idDocumentName}</p>
                        <p className="text-[11px] text-muted-foreground">Stored with this application for admin review.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={idDocumentDataUrl} target="_blank" rel="noreferrer">
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearDocument}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="h-12 w-full" onClick={() => setStep('review')} disabled={!idType || !idDocumentDataUrl}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Review Application</h1>

            <Card className="space-y-2 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{firstName} {lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-medium">{state}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">LGA</span><span className="font-medium">{lga || 'Not provided'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{locationText}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID Type</span><span className="font-medium capitalize">{idType}</span></div>
            </Card>

            {idDocumentDataUrl && (
              <Card className="space-y-3 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground">Uploaded document</p>
                    <p className="font-medium">{idDocumentName}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={idDocumentDataUrl} target="_blank" rel="noreferrer">
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </a>
                  </Button>
                </div>
              </Card>
            )}

            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Your application will be reviewed by the super-admin team before the agent portal is activated for this account.
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="h-12 w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : isAuthenticated ? 'Submit Application' : 'Sign In to Submit'}
            </Button>
          </motion.div>
        )}

        {step === 'submitted' && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-4 pt-20 text-center">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isRejected ? 'bg-destructive/10' : 'bg-success/10'}`}>
              {isRejected ? <XCircle className="h-10 w-10 text-destructive" /> : <CheckCircle className="h-10 w-10 text-success" />}
            </div>

            <h2 className="font-display text-xl font-bold">
              {isApproved ? 'Agent Profile Active' : isRejected ? 'Application Needs Update' : 'Application Submitted'}
            </h2>

            <p className="max-w-xs text-sm text-muted-foreground">
              {isApproved
                ? 'Your agent profile is active. Use your agent code to sign in to the portal.'
                : isRejected
                  ? 'Your last application was rejected. Update the details and resubmit when ready.'
                  : 'Your application is under review. The super-admin must approve it before the agent portal is enabled.'}
            </p>

            <Card className="w-full space-y-2 p-4 text-sm">
              {portalState?.profile && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Agent Code</span><span className="font-mono font-semibold">{portalState.profile.agentCode}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{portalState.profile.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><span className="font-medium capitalize">{portalState.profile.tier}</span></div>
                </>
              )}
              {portalState?.application && !portalState.profile && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Application Status</span><span className="font-medium capitalize">{portalState.application.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="font-medium">{new Date(portalState.application.submittedAtUtc).toLocaleDateString()}</span></div>
                </>
              )}
              {portalState?.application?.idDocumentDataUrl && (
                <div className="rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
                  <p className="mb-2">Uploaded ID document</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={portalState.application.idDocumentDataUrl} target="_blank" rel="noreferrer">
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Open {portalState.application.idDocumentName ?? 'document'}
                    </a>
                  </Button>
                </div>
              )}
              {portalState?.application?.reviewNote && (
                <div className="rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
                  Review note: {portalState.application.reviewNote}
                </div>
              )}
            </Card>

            <div className="flex w-full gap-3 pt-2">
              {isApproved ? (
                <>
                  <Button variant="outline" className="h-12 flex-1" onClick={() => navigate('/dashboard')}>
                    Customer App
                  </Button>
                  <Button className="h-12 flex-1" onClick={() => navigate(portalState?.canAccessPortal ? '/agent' : '/agent/login')}>
                    Open Agent Portal
                  </Button>
                </>
              ) : isRejected ? (
                <>
                  <Button variant="outline" className="h-12 flex-1" onClick={() => navigate('/')}>
                    Back Home
                  </Button>
                  <Button className="h-12 flex-1" onClick={() => setStep('info')}>
                    Update Application
                  </Button>
                </>
              ) : (
                <Button className="h-12 w-full" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('File could not be read.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('File could not be read.'));
    reader.readAsDataURL(file);
  });

export default BecomeAgent;
