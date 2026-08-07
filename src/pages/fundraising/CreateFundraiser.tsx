import { useMemo, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Heart,
  ImagePlus,
  PartyPopper,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
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

type Step = 'form' | 'review';

const categoryCards = [
  { type: 'event', icon: PartyPopper },
  { type: 'project', icon: Briefcase },
  { type: 'emergency', icon: AlertTriangle },
  { type: 'community', icon: Users },
  { type: 'education', icon: GraduationCap },
  { type: 'health', icon: Heart },
] as const;

const CreateFundraiser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('form');
  const [category, setCategory] = useState<string>('project');
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

  const isFormValid = Boolean(
    title.trim() &&
    target &&
    Number(target) > 0 &&
    deadline &&
    story.trim() &&
    typeConfig.fields.every(field => !field.required || Boolean(typeDetails[field.key]?.trim()))
  );

  const handleTypeDetailChange = (key: string, value: string) => {
    setTypeDetails(current => ({
      ...current,
      [key]: value,
    }));
  };

  const handleCategorySelect = (nextCategory: string) => {
    setCategory(nextCategory);
    setTypeDetails({});
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

  return (
    <div className="min-h-screen bg-background pb-20 safe-top">
      {/* Top Bar Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => {
              if (step === 'review') {
                setStep('form');
                return;
              }
              navigate('/fundraising');
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {step === 'review' ? 'Back to Edit' : 'Back to Fundraising'}
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span className={step === 'form' ? 'text-primary' : ''}>1. Setup Campaign</span>
            <span>/</span>
            <span className={step === 'review' ? 'text-primary' : ''}>2. Review & Launch</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'form' && (
              <div className="space-y-8">
                {/* Header */}
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                    Create Your Fundraising Campaign
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fill out your campaign details below to get started. You will review everything before launching.
                  </p>
                </div>

                {/* Section 1: Choose Campaign Type */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> 1. Choose Campaign Category
                    </h2>
                    <p className="text-xs text-muted-foreground">Select the goal that best matches your cause.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryCards.map(item => {
                      const config = campaignTypeConfigs[item.type];
                      const isSelected = category === item.type;

                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleCategorySelect(item.type)}
                          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                              : 'border-border bg-card hover:bg-muted/40'
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{config.label}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{config.shortDescription}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Campaign Details */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">
                      2. {typeConfig.detailsHeading}
                    </h2>
                    <p className="text-xs text-muted-foreground">{typeConfig.shortDescription}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Campaign Title *</Label>
                      <Input
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        placeholder={typeConfig.titlePlaceholder}
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Short Description</Label>
                      <Input
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        placeholder={typeConfig.descriptionPlaceholder}
                        className="h-12 rounded-xl"
                      />
                    </div>

                    {/* Category Specific Fields */}
                    {typeConfig.fields.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}{field.required ? ' *' : ''}</Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={typeDetails[field.key] ?? ''}
                            onChange={event => handleTypeDetailChange(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            className="rounded-xl"
                          />
                        ) : field.type === 'select' ? (
                          <Select
                            value={typeDetails[field.key] ?? ''}
                            onValueChange={value => handleTypeDetailChange(field.key, value)}
                          >
                            <SelectTrigger className="h-12 rounded-xl">
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
                            className="h-12 rounded-xl"
                          />
                        )}
                      </div>
                    ))}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{typeConfig.targetLabel} *</Label>
                        <Input
                          type="number"
                          value={target}
                          onChange={event => setTarget(event.target.value.replace(/[^\d]/g, ''))}
                          placeholder="e.g. 5000000"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{typeConfig.deadlineLabel} *</Label>
                        <Input
                          type="date"
                          value={deadline}
                          onChange={event => setDeadline(event.target.value)}
                          className="h-12 rounded-xl"
                        />
                        <p className="text-[11px] text-muted-foreground">{typeConfig.deadlineHint}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Story & Media */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">3. Story & Media</h2>
                    <p className="text-xs text-muted-foreground">{typeConfig.storyPrompt}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Story *</Label>
                      <Textarea
                        value={story}
                        onChange={event => setStory(event.target.value)}
                        placeholder={typeConfig.storyPlaceholder}
                        rows={6}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaign-cover-image">Campaign Picture or Banner</Label>
                      <Input
                        id="campaign-cover-image"
                        type="file"
                        accept="image/*"
                        onChange={event => {
                          void handleCoverImageChange(event);
                        }}
                        className="h-12 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a photo or flyer to help supporters recognize your cause (Max 1MB).
                      </p>
                      {coverImageError && <p className="text-xs text-destructive">{coverImageError}</p>}
                      {coverImageUrl && (
                        <div className="overflow-hidden rounded-xl border border-border bg-muted/40 mt-2">
                          <img
                            src={coverImageUrl}
                            alt="Campaign cover preview"
                            className="aspect-[16/9] w-full object-cover"
                          />
                          <div className="flex items-center justify-between p-3 text-xs">
                            <span className="truncate text-muted-foreground">{coverImageName || 'Image selected'}</span>
                            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:bg-destructive/10" onClick={clearCoverImage}>
                              <X className="h-4 w-4" /> Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Public Campaign</p>
                        <p className="text-xs text-muted-foreground">Anyone with the link can donate. Turn off for private campaigns.</p>
                      </div>
                      <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    </div>
                  </div>
                </div>

                {/* Form Action */}
                <div className="flex justify-end gap-3">
                  <Button
                    size="lg"
                    onClick={() => setStep('review')}
                    disabled={!isFormValid}
                    className="w-full sm:w-auto px-8 bg-primary font-bold text-primary-foreground h-12 rounded-xl shadow-md"
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">Review Campaign</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please review your campaign details carefully before launching.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  {coverImageUrl && (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <img
                        src={coverImageUrl}
                        alt="Campaign cover preview"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-3 divide-y divide-border/60">
                    {[
                      ['Category', typeConfig.label],
                      ['Title', title],
                      ['Goal Target', `NGN ${Number(target || 0).toLocaleString()}`],
                      ['Deadline', deadline],
                      ['Visibility', isPublic ? 'Public (Anyone can donate)' : 'Members only'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3 pt-2.5 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-right font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewDetailItems.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                    <h2 className="font-display text-base font-bold text-foreground">Specific Category Details</h2>
                    <div className="space-y-2">
                      {reviewDetailItems.map(item => (
                        <div key={item.key} className="flex justify-between gap-3 text-sm rounded-lg bg-muted/30 p-2.5">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-right font-medium text-foreground">
                            {formatReviewValue(typeConfig.fields.find(field => field.key === item.key)?.options, item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {description.trim() && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="font-display text-base font-bold text-foreground mb-1">Short Description</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-display text-base font-bold text-foreground mb-2">Campaign Story</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{story}</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 flex-1 rounded-xl font-semibold border-border"
                    onClick={() => setStep('form')}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 flex-1 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg"
                    onClick={handleCreate}
                    disabled={isSubmitting || isProcessingCoverImage}
                  >
                    {isSubmitting ? (
                      'Launching campaign...'
                    ) : isProcessingCoverImage ? (
                      'Preparing image...'
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Launch Campaign
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateFundraiser;

const buildSanitizedTypeDetails = (typeDetails: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(typeDetails)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0)
  );

const formatReviewValue = (
  options: Array<{ value: string; label: string }> | undefined,
  value: string
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
