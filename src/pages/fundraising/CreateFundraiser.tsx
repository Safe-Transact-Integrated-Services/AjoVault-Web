import { useMemo, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Briefcase, GraduationCap, Heart, ImagePlus, PartyPopper, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/http';
import { createFundraiser, fundraisingKeys } from '@/services/fundraisingApi';
import { campaignTypeConfigs, getCampaignTypeConfig, getCampaignTypeDetailItems } from './campaignTypes';

type Step = 'category' | 'details' | 'story' | 'review';

const categoryCards = [
  { type: 'event', icon: PartyPopper },
  { type: 'project', icon: Briefcase },
  { type: 'emergency', icon: AlertTriangle },
  { type: 'community', icon: Users },
  { type: 'education', icon: GraduationCap },
  { type: 'health', icon: Heart },
] as const;

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
  const [typeDetails, setTypeDetails] = useState<Record<string, string>>({});
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [coverImageError, setCoverImageError] = useState('');
  const [isProcessingCoverImage, setIsProcessingCoverImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeConfig = getCampaignTypeConfig(category);
  const reviewDetailItems = useMemo(() => getCampaignTypeDetailItems(category, typeDetails), [category, typeDetails]);
  const isDetailsStepValid = Boolean(
    title.trim()
    && target
    && Number(target) > 0
    && deadline
    && typeConfig.fields.every(field => !field.required || Boolean(typeDetails[field.key]?.trim())),
  );

  const handleTypeDetailChange = (key: string, value: string) => {
    setTypeDetails(current => ({
      ...current,
      [key]: value,
    }));
  };

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
        typeDetails: buildSanitizedTypeDetails(typeDetails),
        targetAmount,
        deadline,
        isPublic,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fundraisingKeys.list }),
        queryClient.invalidateQueries({ queryKey: fundraisingKeys.detail(fundraiser.id) }),
      ]);

      toast.success('Campaign created. Invite supporters to start receiving donations.');
      navigate(`/fundraising/${fundraiser.id}/invite`);
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, 'Unable to create the campaign.'));
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

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setTypeDetails({});
    setStep('details');
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
              <h1 className="font-display text-2xl font-bold text-foreground">What kind of campaign are you creating?</h1>
              <p className="text-sm text-muted-foreground">
                Choose the campaign type that matches your goal. We’ll tailor the next steps to that type.
              </p>
              <div className="space-y-3">
                {categoryCards.map(item => {
                  const config = campaignTypeConfigs[item.type];

                  return (
                    <button
                      key={item.type}
                      onClick={() => selectCategory(item.type)}
                      className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-accent"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                        <item.icon className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.shortDescription}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">{typeConfig.detailsHeading}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{typeConfig.shortDescription}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign title</Label>
                  <Input
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder={typeConfig.titlePlaceholder}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short description</Label>
                  <Input
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    placeholder={typeConfig.descriptionPlaceholder}
                    className="h-12"
                  />
                </div>

                {typeConfig.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}{field.required ? ' *' : ''}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={typeDetails[field.key] ?? ''}
                        onChange={event => handleTypeDetailChange(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={typeDetails[field.key] ?? ''}
                        onValueChange={value => handleTypeDetailChange(field.key, value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : 'text'}
                        value={typeDetails[field.key] ?? ''}
                        onChange={event => handleTypeDetailChange(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="h-12"
                      />
                    )}
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>{typeConfig.targetLabel}</Label>
                  <Input
                    type="number"
                    value={target}
                    onChange={event => setTarget(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="3000000"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{typeConfig.deadlineLabel}</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={event => setDeadline(event.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">{typeConfig.deadlineHint}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setStep('category')}>
                  Change type
                </Button>
                <Button className="h-12 flex-1" onClick={() => setStep('story')} disabled={!isDetailsStepValid}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'story' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Tell the campaign story</h1>
                <p className="mt-1 text-sm text-muted-foreground">{typeConfig.storyPrompt}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your story</Label>
                  <Textarea
                    value={story}
                    onChange={event => setStory(event.target.value)}
                    placeholder={typeConfig.storyPlaceholder}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-cover-image">Campaign picture or design</Label>
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
                    Upload a flyer, poster, or image that helps supporters trust and recognize the campaign. Max 1MB.
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
                    <p className="text-sm font-medium text-foreground">Public campaign</p>
                    <p className="text-xs text-muted-foreground">Anyone with the link can donate. Turn this off for members-only campaigns.</p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setStep('details')}>
                  Back
                </Button>
                <Button className="h-12 flex-1" onClick={() => setStep('review')} disabled={!story.trim()}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Review campaign</h1>
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
                  ['Campaign type', typeConfig.label],
                  ['Title', title],
                  [typeConfig.targetLabel, `NGN ${Number(target || 0).toLocaleString()}`],
                  [typeConfig.deadlineLabel, deadline],
                  ['Visibility', isPublic ? 'Public (anyone can donate)' : 'Members only'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              {reviewDetailItems.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h2 className="mb-3 font-display text-base font-bold text-foreground">Campaign-specific details</h2>
                  <div className="space-y-2">
                    {reviewDetailItems.map(item => (
                      <div key={item.key} className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-right font-medium text-foreground">
                          {formatReviewValue(typeConfig.fields.find(field => field.key === item.key)?.options, item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {description.trim() && <p className="text-sm text-muted-foreground">{description}</p>}

              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-2 font-display text-base font-bold text-foreground">Story preview</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{story}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setStep('story')}>
                  Back
                </Button>
                <Button className="h-12 flex-1" onClick={handleCreate} disabled={isSubmitting || isProcessingCoverImage}>
                  {isSubmitting ? 'Launching campaign...' : isProcessingCoverImage ? 'Preparing image...' : 'Launch campaign'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateFundraiser;

const buildSanitizedTypeDetails = (typeDetails: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(typeDetails)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0),
  );

const formatReviewValue = (
  options: Array<{ value: string; label: string }> | undefined,
  value: string,
) => options?.find(option => option.value === value)?.label ?? value;

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
