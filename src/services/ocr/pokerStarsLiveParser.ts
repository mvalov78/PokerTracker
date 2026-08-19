import type { TournamentFormData } from "@/types";
import { parseFlexibleTicketDate } from "./parseTicketDate";

const FIELD_LABEL = /(?:Player\s*ID|Country|Chips|Issue\s*date|Buy[\s\-]*[il]n|Entry\s*type|Entry|Issued\s*by|Festival|Venue|Open\s*tournament)/i;

// Field labels that have a corresponding value
const FIELD_LABELS = [
  /^player\s*id$/i,
  /^country$/i,
  /^chips$/i,
  /^issue\s*date$/i,
  /^buy[\s\-]*[il]n$/i,
  /^entry$/i,
  /^entry\s*type$/i,
  /^issued\s*by$/i,
  /^festival$/i,
  /^venue$/i,
  /^open\s*tournament$/i,
];

// Section headers (no corresponding value — just category dividers)
const SECTION_HEADERS = [
  /^registration\s*receipt$/i,
  /^status$/i,
  /^subscription$/i,
  /^tournament$/i,
];

const BARE_LABELS = [
  ...FIELD_LABELS,
  ...SECTION_HEADERS,
  /^poker\s*stars\s*\|?\s*live$/i,
];

function isBareFieldLabel(value: string): boolean {
  const normalized = value.replace(/[:.\-–—>]/g, " ").replace(/\s+/g, " ").trim();
  return BARE_LABELS.some((pattern) => pattern.test(normalized));
}

function stripTrailingLabels(value: string): string {
  const cut = value.search(new RegExp(`\\s+${FIELD_LABEL.source}\\b`, "i"));
  return (cut > 0 ? value.slice(0, cut) : value).trim();
}

/**
 * Для двухколоночного вывода OCR (все лейблы, потом все значения)
 * ищем значения по характерным паттернам в нелейбловых строках.
 */
function findValueByPattern(lines: string[], pattern: RegExp): string | null {
  for (const line of lines) {
    if (isBareFieldLabel(line)) {
      continue;
    }
    if (pattern.test(line.trim())) {
      return line.trim();
    }
  }
  return null;
}

/**
 * Извлекает значения из двухколоночного OCR-текста по характерным паттернам
 * (дата с месяцем, сумма с €/$, фестиваль EPT/WPT и т.д.)
 */
function extractValuesFromFlatText(lines: string[]): {
  festival?: string;
  venue?: string;
  issueDate?: string;
  buyin?: string;
  chips?: string;
} {
  const result: ReturnType<typeof extractValuesFromFlatText> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-–—•]\s*/, "");
    if (!line || isBareFieldLabel(line)) {
      continue;
    }

    if (
      !result.festival &&
      /\b(?:EPT|WPT|WSOP|EAPT|PSPC)\s+[A-Z][a-z]/i.test(line)
    ) {
      result.festival = line;
      continue;
    }

    if (
      !result.issueDate &&
      /\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(line)
    ) {
      result.issueDate = line;
      continue;
    }

    if (!result.buyin && /\d+\s*[€$£]|[€$£]\s*\d+/i.test(line)) {
      result.buyin = line;
      continue;
    }

    if (!result.chips && /^\d{1,3}([.,\s]\d{3})+$/.test(line)) {
      result.chips = line;
      continue;
    }

    if (
      !result.venue &&
      /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(line) &&
      !/Russia|Cash|Strazda/i.test(line)
    ) {
      result.venue = line;
    }
  }

  return result;
}

function getLabeledValue(lines: string[], label: RegExp): string | null {
  const linePattern = new RegExp(
    `^[^A-Za-z0-9]{0,5}(?:${label.source})\\b\\s*[:\\-–—]?\\s*(.*)$`,
    "i",
  );

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(linePattern);
    if (!match) {
      continue;
    }

    const rest = stripTrailingLabels(match[1].trim());
    if (rest && !isBareFieldLabel(rest) && rest !== ">" && rest !== "→") {
      return rest;
    }

    const next = lines[i + 1]?.trim();
    if (next && !isBareFieldLabel(next) && next !== ">" && next !== "→") {
      const stripped = stripTrailingLabels(next);
      if (stripped && !/^\d+$/.test(stripped)) {
        return stripped;
      }
    }
  }

  return null;
}


function parseChipCount(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseMoneyAmount(value: string): number {
  const match = value.match(
    /([0-9]{1,3}(?:[.,\s][0-9]{3})*|[0-9]+)(?:[.,][0-9]{2})?/,
  );
  if (!match) {
    return 0;
  }

  let amount = match[0].replace(/\s/g, "");
  if (/\d+\.\d{3},\d{1,2}$/.test(amount)) {
    amount = amount.replace(/\./g, "").replace(",", ".");
  } else if (/\d+,\d{3}\.\d{1,2}$/.test(amount)) {
    amount = amount.replace(/,/g, "");
  } else if (/\d+,\d{3}$/.test(amount)) {
    amount = amount.replace(/,/g, "");
  } else if (/\d+\.\d{3}$/.test(amount)) {
    amount = amount.replace(/\./g, "");
  } else if (/\d+,\d{1,2}$/.test(amount)) {
    amount = amount.replace(",", ".");
  }

  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractFestivalFallback(text: string): string | null {
  const match = text.match(
    /\b((?:EPT|WPT|WSOP|EAPT|PSPC)(?:\s+[A-Z][A-Za-z]+)(?:\s+\d{4})?)\b/,
  );
  return match?.[1]?.trim() || null;
}

export function isPokerStarsLiveTicket(text: string): boolean {
  const hasBrand = /poker\s*stars/i.test(text);
  const hasReceipt = /registration\s*receipt/i.test(text);
  const hasFestival = /\bfestival\b/i.test(text);
  const hasIssueDate = /issue\s*date/i.test(text);

  if (hasReceipt && hasFestival && hasIssueDate) {
    return true;
  }

  return hasBrand && (hasReceipt || (hasFestival && hasIssueDate));
}

/**
 * Извлекает поля с квитка PokerStars Live (EPT и другие live-серии).
 * Возвращает null, если текст не похож на этот формат.
 */
export function extractPokerStarsLiveFields(
  text: string,
): Partial<TournamentFormData> | null {
  if (!isPokerStarsLiveTicket(text)) {
    return null;
  }

  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const data: Partial<TournamentFormData> = {};
  const flat = extractValuesFromFlatText(lines);

  function getValue(label: RegExp, flatValue?: string): string | null {
    return getLabeledValue(lines, label) || flatValue || null;
  }

  const festival =
    getValue(/festival/i, flat.festival) || extractFestivalFallback(text);
  const openTournament = getLabeledValue(lines, /open\s*tournament/i);
  if (openTournament && !isBareFieldLabel(openTournament)) {
    data.name = openTournament;
  } else if (festival) {
    data.name = festival;
  }

  const venue = getValue(/venue/i, flat.venue);
  if (venue) {
    data.venue = venue;
  } else if (festival) {
    const cityFromFestival = festival.match(
      /(?:EPT|WPT|WSOP|EAPT|PSPC)\s+([A-Za-z]+)/i,
    );
    if (cityFromFestival?.[1]) {
      data.venue = cityFromFestival[1];
    }
  }
  if (!data.venue) {
    data.venue = "PokerStars Live";
  }

  const issueDate = getValue(/issue\s*date/i, flat.issueDate);
  if (issueDate) {
    const parsedDate = parseFlexibleTicketDate(issueDate);
    if (parsedDate) {
      data.date = parsedDate;
    }
  }
  if (!data.date) {
    const parsedDate = parseFlexibleTicketDate(text);
    if (parsedDate) {
      data.date = parsedDate;
    }
  }

  const buyinValue = getValue(/buy[\s\-]*[il]n/i, flat.buyin);
  if (buyinValue) {
    const buyin = parseMoneyAmount(buyinValue);
    if (buyin > 0) {
      data.buyin = buyin;
    }
  }

  const chipsValue = getValue(/chips/i, flat.chips);
  if (chipsValue) {
    const chips = parseChipCount(chipsValue);
    if (chips > 0) {
      data.startingStack = chips;
    }
  }

  return data;
}
