import { useState } from 'react';
import { ArrowLeft, PartyPopper, Briefcase, AlertTriangle, Users, GraduationCap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type Step = 'category' | 'details' | 'story' | 'review';

const categories = [
  { type: 'event', label: 'Event', desc: 'Wedding, birthday, party', icon: PartyPopper },
  { type: 'project', label: 'Project', desc: 'Business or community project', icon: Briefcase },
  { type: 'emergency', label: 'Emergency', desc: 'Urgent medical or personal need', icon: AlertTriangle },
  { type: 'community', label: 'Community', desc: 'Community development', icon: Users },
  { type: 'education', label: 'Education', desc: 'Scholarships or school support', icon: GraduationCap },
  { type: 'health', label: 'Health', desc: 'Medical bills or health causes', icon: Heart },
];

const CreateFundraiser = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [story, setStory] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const goBack = () => {
    if (step === 'details') setStep('category');
    else if (step === 'story') setStep('details');
    else if (step === 'review') setStep('story');
    else navigate(-1);
  };

  const handleCreate = () => {
    toast.success('Fundraiser created! Share the link to start receiving donations.');
    navigate('/fundraising');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex gap-1">
        {['category', 'details', 'story', 'review'].map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${['category', 'details', 'story', 'review'].indexOf(step) >= i ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'category' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">What's the fundraiser for?</h1>
              <div className="space-y-3">
                {categories.map(c => (
                  <button
                    key={c.type}
                    onClick={() => { setCategory(c.type); setStep('details'); }}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-accent transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <c.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Campaign Details</h1>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Campaign Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Community Tech Hub Launch" className="h-12" /></div>
                <div className="space-y-2"><Label>Short Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your campaign" className="h-12" /></div>
                <div className="space-y-2"><Label>Target Amount (₦)</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="3,000,000" className="h-12" /></div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="h-12" /></div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('story')} disabled={!title || !target || !deadline}>Continue</Button>
            </div>
          )}

          {step === 'story' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Tell Your Story</h1>
              <p className="text-sm text-muted-foreground">A compelling story helps people connect and donate. Share why this matters.</p>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Your Story</Label><Textarea value={story} onChange={e => setStory(e.target.value)} placeholder="Tell people why this campaign matters..." rows={6} /></div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Public Campaign</p>
                    <p className="text-xs text-muted-foreground">Anyone with the link can donate (including non-members)</p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('review')} disabled={!story}>Continue</Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Review Campaign</h1>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                {[
                  ['Title', title],
                  ['Category', category],
                  ['Target', `₦${Number(target).toLocaleString()}`],
                  ['Deadline', deadline],
                  ['Visibility', isPublic ? 'Public (anyone can donate)' : 'Private (members only)'],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium text-foreground capitalize">{v}</span>
                  </div>
                ))}
              </div>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <Button className="w-full h-12" onClick={handleCreate}>Launch Campaign</Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateFundraiser;
