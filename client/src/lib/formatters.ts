import { format, formatDistance } from 'date-fns';

/**
 * Format a numeric value as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date to a readable string (e.g., "12 May 2023")
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format a date to a time string (e.g., "09:15 AM")
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  } catch (error) {
    return 'Invalid time';
  }
};

/**
 * Format duration in minutes to readable string (e.g., "2h 45m")
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format a date to a relative time string (e.g., "5 minutes ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    return 'Invalid time';
  }
};

/**
 * Capitalize the first letter of each word in a string
 */
export const capitalizeString = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get plan type label with proper formatting
 */
export const getPlanTypeLabel = (planType: string): string => {
  return planType.charAt(0).toUpperCase() + planType.slice(1);
};
