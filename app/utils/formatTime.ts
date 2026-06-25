export function formatDateTime(dateTime: Date): string {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - dateTime.getTime()) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    if (diffSeconds < 0) {
      return "0 sekunder siden";
    } else if (diffSeconds === 1) {
      return "1 sekund siden";
    }
    return `${diffSeconds} sekunder siden`;
  } else if (diffMinutes < 60) {
    if (diffMinutes === 1) {
      return "1 minutt siden";
    }
    return `${diffMinutes} minutter siden`;
  } else if (diffHours < 24) {
    if (diffHours === 1) {
      return "1 time siden";
    }
    return `${diffHours} timer siden`;
  } else if (isYesterday(dateTime, now)) {
    return `kl. ${formatTime(dateTime)} i går`;
  } else {
    return formatDateTimeFull(dateTime);
  }
}

export function isYesterday(d1: Date, d2: Date): boolean {
  const yesterday = new Date(d2);
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d1.getFullYear() === yesterday.getFullYear() &&
    d1.getMonth() === yesterday.getMonth() &&
    d1.getDate() === yesterday.getDate()
  );
}

export function formatTime(date: Date): string {
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

export function formatDateTimeFull(date: Date): string {
  return `${formatTime(date)} ${padZero(date.getDate())}-${padZero(date.getMonth() + 1)}-${date.getFullYear()} `;
}

export function formatDate(date: Date): string {
  return `${padZero(date.getDate())}-${padZero(date.getMonth() + 1)}-${date.getFullYear()} `;
}

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function isOlderThan(updated: Date, weeks?: number | null): boolean {
  const currentDate = new Date();
  const millisecondsInAWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
  const threshold = weeks
    ? weeks * millisecondsInAWeek
    : 30 * 24 * 60 * 60 * 1000; // Use weeks or default to 30 days
  return currentDate.getTime() - updated.getTime() > threshold;
}
