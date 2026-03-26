import { useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Briefcase, GraduationCap, Heart, ImagePlus, PartyPopper, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/http';
import { createFundraiser, fundraisingKeys } from '@/services/fundraisingApi';

type Step = 'category' | 'details' | 'story' | 'review';

const categories = [
  { type: 'event', label: 'Event', desc: 'Wedding, birthday, party', icon: PartyPopper },
  { type: 'project', label: 'Project', desc: 'Business or community project', icon: Briefcase },
  { type: 'emergency', label: 'Emergency', desc: 'Urgent medical or personal need', icon: AlertTriangle },
  { type: 'community', label: 'Community', desc: 'Community development', icon: Users },
  { type: 'education', label: 'Education', desc: 'Scholarships or school support', icon: GraduationCap },
  { type: 'health', label: 'Health', desc: 'Medical bills or health causes', icon: Heart },
];

const steps: Step[] = ['category', 'details', 'story', 'review'];

const CreateFundraiser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [story, setStory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [coverImageError, setCoverImageError] = useState('');
  const [isProcessingCoverImage, setIsProcessingCoverImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const targetAmount = Number(target);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0 || !deadline || !story.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const fundraiser = await createFundraiser({
        title,
        description,
        coverImageUrl: coverImageUrl || undefined,
        story,
        category,
        targetAmount,
        deadline,
        isPublic,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fundraisingKeys.list }),
        queryClient.invalidateQueries({ queryKey: fundraisingKeys.detail(fundraiser.id) }),
      ]);

      toast.success('Fundraiser created. Invite supporters to start receiving donations.');
      navigate(`/fundraising/${fundraiser.id}/invite`);
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, 'Unable to create the fundraiser.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setCoverImageError('');

    if (!file.type.startsWith('image/')) {
      setCoverImageError('Choose a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 1024 * 1024) {
      setCoverImageError('Choose an image smaller than 1MB.');
      event.target.value = '';
      return;
    }

    setIsProcessingCoverImage(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCoverImageUrl(dataUrl);
      setCoverImageName(file.name);
    } catch {
      setCoverImageError('Unable to load this image right now.');
    } finally {
      setIsProcessingCoverImage(false);
      event.target.value = '';
    }
  };

  const clearCoverImage = () => {
    setCoverImageUrl('');
    setCoverImageName('');
    setCoverImageError('');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <div className="mb-6 flex gap-1">
        {steps.map((currentStep, index) => (
          <div
            key={currentStep}
            className={`h-1 flex-1 rounded-full ${steps.indexOf(step) >= index ? 'bg-accent' : 'bg-muted'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'category' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">What's the fundraiser for?</h1>
              <div className="space-y-3">
                {categories.map(item => (
                  <button
                    key={item.type}
                    onClick={() => {
                      setCategory(item.type);
                      setStep('details');
                    }}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <item.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
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
                <div className="space-y-2">
                  <Label>Campaign Title</Label>
                  <Input
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder="e.g., Community Tech Hub Launch"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Input
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    placeholder="Brief description of your campaign"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Amount (NGN)</Label>
                  <Input
                    type="number"
                    value={target}
                    onChange={event => setTarget(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="3000000"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={event => setDeadline(event.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
              <Button className="h-12 w-full" onClick={() => setStep('story')} disabled={!title.trim() || !target || !deadline}>
                Continue
              </Button>
            </div>
          )}

          {step === 'story' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Tell Your Story</h1>
              <p className="text-sm text-muted-foreground">
                A compelling story helps people connect and donate. Share why this matters.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Story</Label>
                  <Textarea
                    value={story}
                    onChange={event => setStory(event.target.value)}
                    placeholder="Tell people why this campaign matters..."
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-cover-image">Campaign Picture or Design</Label>
                  <Input
                    id="campaign-cover-image"
                    type="file"
                    accept="image/*"
                    onChange={event => {
                      void handleCoverImageChange(event);
                    }}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a campaign flyer, poster, or image. PNG, JPG, and WEBP work best. Max 1MB.
                  </p>
                  {coverImageError && <p className="text-xs text-destructive">{coverImageError}</p>}
                  {coverImageUrl && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                      <img
                        src={coverImageUrl}
                        alt="Campaign cover preview"
                        className="aspect-[16/9] w-full object-cover"
                      />
                      <div className="flex items-center justify-between gap-3 p-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ImagePlus className="h-4 w-4" />
                          <span className="truncate">{coverImageName || 'Campaign image selected'}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={clearCoverImage}>
                          <X className="h-4 w-4" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Public Campaign</p>
                    <p className="text-xs text-muted-foreground">Anyone with the link can donate. Turn this off for members-only campaigns.</p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </div>
              <Button className="h-12 w-full" onClick={() => setStep('review')} disabled={!story.trim()}>
                Continue
              </Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Review Campaign</h1>
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                {coverImageUrl && (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <img
                      src={coverImageUrl}
                      alt="Campaign cover preview"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                )}
                {[
                  ['Title', title],
                  ['Category', category],
                  ['Target', `NGN ${Number(target || 0).toLocaleString()}`],
                  ['Deadline', deadline],
                  ['Visibility', isPublic ? 'Public (anyone can donate)' : 'Members only'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium capitalize text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              {description.trim() && <p className="text-sm text-muted-foreground">{description}</p>}
              <Button className="h-12 w-full" onClick={handleCreate} disabled={isSubmitting || isProcessingCoverImage}>
                {isSubmitting ? 'Launching campaign...' : isProcessingCoverImage ? 'Preparing image...' : 'Launch Campaign'}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateFundraiser;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read image.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
