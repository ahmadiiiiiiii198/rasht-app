/**
 * Price utility functions for handling price calculations and formatting
 * Matches the website version's approach
 */

/**
 * Rounds a number to 2 decimal places to avoid floating-point precision issues
 */
export const roundToTwoDecimals = (value: number): number => {
    return Math.round(value * 100) / 100;
};

/**
 * Safely parses a string or number to a price
 * Handles both string and number inputs from database
 */
export const parsePrice = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
        if (value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : roundToTwoDecimals(parsed);
    }
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : roundToTwoDecimals(value);
    }
    return 0;
};

/**
 * Formats a price for display with currency symbol
 */
export const formatPrice = (price: number, currency: string = '€'): string => {
    const roundedPrice = roundToTwoDecimals(price);
    return `${currency}${roundedPrice.toFixed(2)}`;
};

/**
 * Safely formats a price for display, handling string inputs from database
 */
export const safeFormatPrice = (price: string | number | null | undefined, currency: string = '€'): string => {
    const numericPrice = parsePrice(price);
    return formatPrice(numericPrice, currency);
};

/**
 * Calculates the total price for multiple items
 */
export const calculateTotal = (price: number, quantity: number): number => {
    return roundToTwoDecimals(price * quantity);
};

/**
 * Validates if a price is valid (positive number)
 */
export const isValidPrice = (price: number): boolean => {
    return typeof price === 'number' && !isNaN(price) && price >= 0;
};
