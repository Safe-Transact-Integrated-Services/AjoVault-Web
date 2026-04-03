export type CampaignCategory =
  | 'event'
  | 'project'
  | 'emergency'
  | 'community'
  | 'education'
  | 'health';

export type CampaignTypeFieldType = 'text' | 'textarea' | 'date' | 'select';

export interface CampaignTypeFieldOption {
  value: string;
  label: string;
}

export interface CampaignTypeFieldConfig {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: CampaignTypeFieldType;
  options?: CampaignTypeFieldOption[];
}

export interface CampaignTypeConfig {
  category: CampaignCategory;
  label: string;
  shortDescription: string;
  descriptionPlaceholder: string;
  titlePlaceholder: string;
  detailsHeading: string;
  storyPrompt: string;
  storyPlaceholder: string;
  targetLabel: string;
  deadlineLabel: string;
  deadlineHint: string;
  fields: CampaignTypeFieldConfig[];
}

export const campaignTypeConfigs: Record<CampaignCategory, CampaignTypeConfig> = {
  event: {
    category: 'event',
    label: 'Event',
    shortDescription: 'Weddings, birthdays, memorials, reunions, and celebrations',
    descriptionPlaceholder: 'What event is this for, and what support is needed?',
    titlePlaceholder: 'e.g., Support Tolu and Ada Wedding Celebration',
    detailsHeading: 'Event details',
    storyPrompt: 'Explain the occasion, why support matters now, and how contributions will be used.',
    storyPlaceholder: 'Share the event story, the people involved, and what donations will help cover.',
    targetLabel: 'Event budget target (NGN)',
    deadlineLabel: 'Contribution deadline',
    deadlineHint: 'Set the latest date supporters can contribute before the event.',
    fields: [
      {
        key: 'occasionType',
        label: 'Occasion type',
        placeholder: 'Select occasion type',
        required: true,
        type: 'select',
        options: [
          { value: 'wedding', label: 'Wedding' },
          { value: 'birthday', label: 'Birthday' },
          { value: 'memorial', label: 'Memorial' },
          { value: 'reunion', label: 'Reunion' },
          { value: 'other', label: 'Other event' },
        ],
      },
      { key: 'celebrantOrHost', label: 'Celebrant or host', placeholder: 'Who is the event for?', required: true },
      { key: 'eventDate', label: 'Event date', placeholder: 'Select event date', required: true, type: 'date' },
      { key: 'eventLocation', label: 'Event location', placeholder: 'City, state, or venue', required: false },
      {
        key: 'supportNeed',
        label: 'What donations will cover',
        placeholder: 'Venue, food, transport, memorial arrangements, and more',
        required: true,
        type: 'textarea',
      },
    ],
  },
  project: {
    category: 'project',
    label: 'Project',
    shortDescription: 'Business, creative, faith-based, or community projects',
    descriptionPlaceholder: 'What project are you raising for?',
    titlePlaceholder: 'e.g., Build a Community Tech Hub in Ikeja',
    detailsHeading: 'Project details',
    storyPrompt: 'Show the project vision, current stage, and the concrete outcome donors will help unlock.',
    storyPlaceholder: 'Explain the project, the problem it solves, and how supporters will see progress.',
    targetLabel: 'Project funding target (NGN)',
    deadlineLabel: 'Funding deadline',
    deadlineHint: 'Set the date you need to reach this funding goal.',
    fields: [
      { key: 'projectOwner', label: 'Project owner', placeholder: 'Individual, team, church, or organization name', required: true },
      { key: 'projectLocation', label: 'Project location', placeholder: 'City, state, or community', required: true },
      {
        key: 'projectStage',
        label: 'Project stage',
        placeholder: 'Select project stage',
        required: true,
        type: 'select',
        options: [
          { value: 'planning', label: 'Planning' },
          { value: 'launching', label: 'Launching' },
          { value: 'building', label: 'Building' },
          { value: 'scaling', label: 'Scaling' },
        ],
      },
      {
        key: 'useOfFunds',
        label: 'How the funds will be used',
        placeholder: 'Equipment, rent, materials, salaries, training, and more',
        required: true,
        type: 'textarea',
      },
    ],
  },
  emergency: {
    category: 'emergency',
    label: 'Emergency',
    shortDescription: 'Urgent family, disaster, accident, relocation, or crisis support',
    descriptionPlaceholder: 'What emergency happened, and what immediate help is needed?',
    titlePlaceholder: 'e.g., Urgent Relief Support for the Bello Family',
    detailsHeading: 'Emergency details',
    storyPrompt: 'Be clear about what happened, who is affected, and what urgent expenses donations will cover.',
    storyPlaceholder: 'Explain the emergency, the timeline, and why support is needed right away.',
    targetLabel: 'Urgent amount needed (NGN)',
    deadlineLabel: 'Urgency deadline',
    deadlineHint: 'Set a realistic date for the most urgent stage of the appeal.',
    fields: [
      { key: 'affectedPerson', label: 'Person or family affected', placeholder: 'Who is directly affected?', required: true },
      { key: 'emergencyType', label: 'Emergency type', placeholder: 'Accident, displacement, fire, legal issue, and more', required: true },
      {
        key: 'urgencyLevel',
        label: 'Urgency level',
        placeholder: 'Select urgency level',
        required: true,
        type: 'select',
        options: [
          { value: 'critical', label: 'Critical' },
          { value: 'high', label: 'High' },
          { value: 'time-sensitive', label: 'Time-sensitive' },
        ],
      },
      { key: 'incidentLocation', label: 'Location', placeholder: 'Where did it happen?', required: true },
    ],
  },
  community: {
    category: 'community',
    label: 'Community',
    shortDescription: 'Neighborhood, church, school, and civic improvement campaigns',
    descriptionPlaceholder: 'What community change are you funding?',
    titlePlaceholder: 'e.g., Clean Water for Oke-Ado Community',
    detailsHeading: 'Community details',
    storyPrompt: 'Help donors understand the community, the beneficiaries, and the impact this campaign will create.',
    storyPlaceholder: 'Describe the community need, how many people will benefit, and what success looks like.',
    targetLabel: 'Community goal (NGN)',
    deadlineLabel: 'Goal deadline',
    deadlineHint: 'Set the date by which the community needs the funds.',
    fields: [
      { key: 'communityName', label: 'Community name', placeholder: 'Name of community, school, or group', required: true },
      { key: 'communityLocation', label: 'Community location', placeholder: 'Town, state, or district', required: true },
      { key: 'beneficiaryGroup', label: 'Who will benefit', placeholder: 'Residents, students, women, youth, patients, and more', required: true },
      {
        key: 'impactGoal',
        label: 'Expected impact',
        placeholder: 'What change will this campaign create?',
        required: true,
        type: 'textarea',
      },
    ],
  },
  education: {
    category: 'education',
    label: 'Education',
    shortDescription: 'School fees, scholarships, books, exams, and learning support',
    descriptionPlaceholder: 'What education need are you raising for?',
    titlePlaceholder: 'e.g., Help Amaka Pay Her Nursing School Fees',
    detailsHeading: 'Education details',
    storyPrompt: 'Show the student, the school, the academic goal, and the exact education cost this campaign will cover.',
    storyPlaceholder: 'Explain the learner’s story, the opportunity ahead, and what the funds will pay for.',
    targetLabel: 'Education target (NGN)',
    deadlineLabel: 'Payment deadline',
    deadlineHint: 'Use the date by which fees or education expenses need to be paid.',
    fields: [
      { key: 'studentName', label: 'Student name', placeholder: 'Who is being supported?', required: true },
      { key: 'institutionName', label: 'School or institution', placeholder: 'School, university, or training center', required: true },
      {
        key: 'educationLevel',
        label: 'Education level',
        placeholder: 'Select education level',
        required: true,
        type: 'select',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'tertiary', label: 'Tertiary' },
          { value: 'vocational', label: 'Vocational' },
          { value: 'professional', label: 'Professional exam or certification' },
        ],
      },
      {
        key: 'fundingPurpose',
        label: 'What the funds will cover',
        placeholder: 'School fees, books, hostel, transport, exams, devices, and more',
        required: true,
        type: 'textarea',
      },
    ],
  },
  health: {
    category: 'health',
    label: 'Health',
    shortDescription: 'Medical treatment, surgery, medication, and recovery support',
    descriptionPlaceholder: 'What medical need are you raising for?',
    titlePlaceholder: 'e.g., Help Femi Raise Funds for Surgery',
    detailsHeading: 'Medical details',
    storyPrompt: 'Be clear about the patient, the treatment plan, the facility, and the costs donors are helping to cover.',
    storyPlaceholder: 'Explain the health challenge, recommended treatment, and why timely support matters.',
    targetLabel: 'Treatment target (NGN)',
    deadlineLabel: 'Treatment deadline',
    deadlineHint: 'Use the date the next treatment or payment milestone is due.',
    fields: [
      { key: 'patientName', label: 'Patient name', placeholder: 'Who needs medical support?', required: true },
      { key: 'medicalCondition', label: 'Medical condition or need', placeholder: 'Diagnosis, procedure, or treatment need', required: true },
      { key: 'hospitalOrClinic', label: 'Hospital or clinic', placeholder: 'Where treatment is taking place', required: true },
      {
        key: 'treatmentPurpose',
        label: 'What the funds will cover',
        placeholder: 'Surgery, medication, admission, diagnostics, rehab, and more',
        required: true,
        type: 'textarea',
      },
    ],
  },
};

export const getCampaignTypeConfig = (category: string): CampaignTypeConfig =>
  campaignTypeConfigs[(category as CampaignCategory) || 'project'] ?? campaignTypeConfigs.project;

export const formatCampaignCategoryLabel = (category: string): string =>
  getCampaignTypeConfig(category).label;

export const getCampaignTypeDetailItems = (
  category: string,
  typeDetails: Record<string, string> | undefined,
): Array<{ key: string; label: string; value: string }> => {
  const config = getCampaignTypeConfig(category);
  const details = typeDetails ?? {};

  return config.fields
    .map(field => {
      const value = details[field.key];
      if (!value) {
        return null;
      }

      return {
        key: field.key,
        label: field.label,
        value: formatCampaignTypeDetailValue(field, value),
      };
    })
    .filter((item): item is { key: string; label: string; value: string } => item !== null);
};

const formatCampaignTypeDetailValue = (field: CampaignTypeFieldConfig, value: string): string => {
  if (field.options) {
    return field.options.find(option => option.value === value)?.label ?? value;
  }

  if (field.type === 'date') {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  }

  return value;
};
