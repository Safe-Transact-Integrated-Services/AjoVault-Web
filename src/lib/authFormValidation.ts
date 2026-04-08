const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;

export const normalizePhoneNumberInput = (value: string) => value.replace(/\D/g, '');

export const validateEmailAddress = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return 'Email address is required.';
  }

  if (!EMAIL_REGEX.test(normalizedValue)) {
    return 'Enter a valid email address.';
  }

  return '';
};

export const validateOptionalEmailAddress = (value: string) => {
  if (!value.trim()) {
    return '';
  }

  return validateEmailAddress(value);
};

export const validatePhoneNumber = (value: string) => {
  const digits = normalizePhoneNumberInput(value);

  if (!digits) {
    return 'Phone number is required.';
  }

  if (digits.length !== 11 || !digits.startsWith('0')) {
    return 'Enter a valid phone number in local format, e.g. 08000000000.';
  }

  return '';
};

export const validateOptionalPhoneNumber = (value: string) => {
  if (!value.trim()) {
    return '';
  }

  return validatePhoneNumber(value);
};

export const validateLoginIdentifier = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Enter your phone number or email address.';
  }

  if (trimmedValue.includes('@')) {
    return validateEmailAddress(trimmedValue);
  }

  return validatePhoneNumber(trimmedValue);
};

export const validatePersonName = (value: string, label: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return `${label} is required.`;
  }

  if (trimmedValue.length < 2) {
    return `${label} must be at least 2 characters.`;
  }

  if (!NAME_REGEX.test(trimmedValue)) {
    return `${label} can only contain letters, spaces, apostrophes, and hyphens.`;
  }

  return '';
};
