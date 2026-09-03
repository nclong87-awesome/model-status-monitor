/**
 * Helper utilities for formatting timestamps and relative unlock times.
 */

/**
 * Format a UTC unlock timestamp string into a human-readable relative duration string
 * Example outputs:
 *  - "in 3 hours"
 *  - "in 1 day"
 *  - "in 4 days 5 hours"
 *  - "in 25 minutes"
 *  - "unlocking now"
 */
export function formatUnlockTime(unlocksAtUtc: string | null | undefined, now: Date = new Date()): string {
  if (!unlocksAtUtc) {
    return '';
  }

  const unlockDate = new Date(unlocksAtUtc);
  if (isNaN(unlockDate.getTime())) {
    return '';
  }

  const diffMs = unlockDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'unlocking now';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const remHours = totalHours % 24;
  const remMinutes = totalMinutes % 60;
  const remSeconds = totalSeconds % 60;

  // 1. Days (e.g. "in 1 day", "in 4 days 5 hours", "in 2 days")
  if (totalDays >= 1) {
    const dayStr = `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
    if (remHours > 0) {
      const hourStr = `${remHours} ${remHours === 1 ? 'hour' : 'hours'}`;
      return `in ${dayStr} ${hourStr}`;
    }
    return `in ${dayStr}`;
  }

  // 2. Hours (e.g. "in 3 hours", "in 3 hours 15 mins")
  if (totalHours >= 1) {
    const hourStr = `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'}`;
    if (remMinutes > 0) {
      const minStr = `${remMinutes} ${remMinutes === 1 ? 'min' : 'mins'}`;
      return `in ${hourStr} ${minStr}`;
    }
    return `in ${hourStr}`;
  }

  // 3. Minutes (e.g. "in 25 minutes", "in 1 minute 30 secs")
  if (totalMinutes >= 1) {
    const minStr = `${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`;
    if (remSeconds > 0 && totalMinutes < 10) {
      const secStr = `${remSeconds} ${remSeconds === 1 ? 'sec' : 'secs'}`;
      return `in ${minStr} ${secStr}`;
    }
    return `in ${minStr}`;
  }

  // 4. Seconds (e.g. "in 45 seconds")
  return `in ${totalSeconds} ${totalSeconds === 1 ? 'second' : 'seconds'}`;
}

/**
 * Format success rate percentage cleanly without long decimal tails.
 * Examples:
 *  - 100 => "100"
 *  - 66.66666666666667 => "66.7"
 *  - 50 => "50"
 *  - 0 => "0"
 */
export function formatSuccessRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return '0';
  }
  if (Number.isInteger(rate)) {
    return rate.toString();
  }
  const rounded = Number(rate.toFixed(1));
  return rounded.toString();
}

/**
 * Format average latency time in seconds.
 */
export function formatAverageTime(seconds: number | null | undefined, decimals = 3): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return 'N/A';
  }
  return `${seconds.toFixed(decimals)}s`;
}

/**
 * Format timestamp string into date and time format (e.g. "Sep 1, 2026, 05:08:13 AM").
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Untested';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format a past timestamp into a clean relative duration string (e.g. "2m ago", "1h ago", "Aug 25")
 */
export function formatRelativeTime(dateStr?: string | null, now: Date = new Date()): string {
  if (!dateStr) return 'Untested';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    const dateFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

/**
 * Helper to calculate a future ISO timestamp string given relative offsets (days, hours, minutes)
 */
export function createUnlockTimestamp(offsetHours: number = 0, offsetDays: number = 0, offsetMinutes: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(d.getHours() + offsetHours);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString();
}
