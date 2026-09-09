export function todayInTimezone(timezone: string): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the string our Task.date
  // column is keyed on — this is how "today" gets computed per-user.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

export function currentTimeInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// True when `current` is at or up to `windowMinutes` after `target` — i.e. the
// preferred time has just been reached. This cron may only run once (or a few
// times) a day, so callers should hit this endpoint frequently (e.g. every
// 15-30 min via an external pinger like cron-job.org) for the window to
// reliably catch each user's preferred moment.
export function isWithinWindow(current: string, target: string, windowMinutes = 20): boolean {
  const diff = toMinutes(current) - toMinutes(target);
  return diff >= 0 && diff <= windowMinutes;
}
