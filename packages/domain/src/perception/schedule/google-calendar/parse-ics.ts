export type ParsedIcsEvent = {
  readonly uid: string;
  readonly title: string;
  readonly startAt: Date;
  readonly note?: string;
};

function unfoldIcsLines(content: string): string[] {
  const raw = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines: string[] = [];

  for (const line of raw) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      const previous = lines.pop() ?? '';
      lines.push(previous + line.trimStart());
      continue;
    }
    lines.push(line);
  }

  return lines;
}

function parseIcsDate(value: string, timeZone: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const dateKey = `${year}-${month}-${day}`;
    if (timeZone === 'Asia/Tokyo') {
      return new Date(`${dateKey}T12:00:00+09:00`);
    }
    return new Date(`${dateKey}T12:00:00Z`);
  }

  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(trimmed);
  if (!dateTime) return null;

  const [, year, month, day, hour, minute, second, zulu] = dateTime;
  const dateKey = `${year}-${month}-${day}`;
  const hh = hour ?? '00';
  const mm = minute ?? '00';
  const ss = second ?? '00';

  if (zulu) {
    return new Date(`${dateKey}T${hh}:${mm}:${ss}Z`);
  }

  if (timeZone === 'Asia/Tokyo') {
    return new Date(`${dateKey}T${hh}:${mm}:${ss}+09:00`);
  }

  return new Date(`${dateKey}T${hh}:${mm}:${ss}Z`);
}

function parseVeventBlock(block: string, timeZone: string): ParsedIcsEvent | null {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
  let uid = '';
  let title = '予定';
  let startValue = '';
  let description: string | undefined;

  for (const line of lines) {
    if (line.startsWith('UID:')) {
      uid = line.slice(4).trim();
      continue;
    }
    if (line.startsWith('SUMMARY:')) {
      title = line.slice(8).trim();
      continue;
    }
    if (line.startsWith('DTSTART')) {
      const colon = line.indexOf(':');
      startValue = colon >= 0 ? line.slice(colon + 1).trim() : '';
      continue;
    }
    if (line.startsWith('DESCRIPTION:')) {
      description = line.slice(12).trim().replace(/\\n/g, ' ');
    }
  }

  const startAt = parseIcsDate(startValue, timeZone);
  if (!startAt || !uid) {
    return null;
  }

  return {
    uid,
    title,
    startAt,
    ...(description ? { note: description } : {}),
  };
}

/** 最小 ICS パーサ（VEVENT のみ · Domain 正本） */
export function parseIcsEvents(content: string, timeZone: string): ParsedIcsEvent[] {
  const lines = unfoldIcsLines(content);
  const normalized = lines.join('\n');
  const blocks = normalized.split('BEGIN:VEVENT').slice(1);
  const events: ParsedIcsEvent[] = [];

  for (const block of blocks) {
    const body = block.split('END:VEVENT')[0] ?? '';
    const parsed = parseVeventBlock(body, timeZone);
    if (parsed) {
      events.push(parsed);
    }
  }

  return events;
}

export function filterIcsEventsForMonth(
  events: readonly ParsedIcsEvent[],
  year: number,
  month: number,
  timeZone: string,
): ParsedIcsEvent[] {
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  return events.filter((event) => {
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(event.startAt);
    return dateKey.startsWith(monthPrefix);
  });
}
