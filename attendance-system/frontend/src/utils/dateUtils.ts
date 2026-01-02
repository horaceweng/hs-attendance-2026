// src/utils/dateUtils.ts

/**
 * Convert Gregorian year to ROC year (民國年)
 * @param year Gregorian year (e.g., 2025)
 * @returns ROC year (e.g., 114)
 */
export const toRocYear = (year: number): number => {
  return year - 1911;
};

/**
 * Convert ROC year to Gregorian year
 * @param rocYear ROC year (e.g., 114)
 * @returns Gregorian year (e.g., 2025)
 */
export const toGregorianYear = (rocYear: number): number => {
  return rocYear + 1911;
};

/**
 * Format an academic year in ROC format
 * @param gregorianYear Gregorian year (e.g., 2025)
 * @returns Formatted academic year string (e.g., "114學年")
 */
export const formatAcademicYear = (gregorianYear: number | string): string => {
  const year = typeof gregorianYear === 'string' 
    ? parseInt(gregorianYear, 10) 
    : gregorianYear;
  
  return `${toRocYear(year)}學年`;
};