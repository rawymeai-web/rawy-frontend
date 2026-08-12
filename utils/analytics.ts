/**
 * Utility for tracking Facebook Pixel analytics events.
 */
export const trackPixelEvent = (event: string, parameters?: any) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    try {
      (window as any).fbq('track', event, parameters);
    } catch (e) {
      console.error("Failed to track FB Pixel event:", e);
    }
  } else {
    // Fail-safe logging for local development
    console.log(`[FB Pixel Event] ${event}`, parameters || '');
  }
};
