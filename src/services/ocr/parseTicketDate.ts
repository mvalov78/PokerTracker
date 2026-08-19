const MONTH_INDEX: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

function withTime(year: string, month: string, day: string, time?: string): string {
  const normalizedTime = time && /^\d{1,2}:\d{2}/.test(time) ? time.slice(0, 5) : "18:00";
  const [hours, minutes] = normalizedTime.split(":");
  return `${year}-${month}-${day}T${hours.padStart(2, "0")}:${minutes}`;
}

/**
 * Парсит дату с билета: числовые форматы и английские названия месяцев.
 * Примеры: 17.08.2026, 17 August 2026 21:10, Aug 17, 2026
 */
export function parseFlexibleTicketDate(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  const numericDmy = dateStr.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (numericDmy) {
    const [, day, month, year] = numericDmy;
    return withTime(year, month.padStart(2, "0"), day.padStart(2, "0"));
  }

  const numericYmd = dateStr.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (numericYmd) {
    const [, year, month, day] = numericYmd;
    return withTime(year, month.padStart(2, "0"), day.padStart(2, "0"));
  }

  const months = Object.keys(MONTH_INDEX).join("|");
  const dayFirst = dateStr.match(
    new RegExp(
      `(\\d{1,2})\\s+(${months})\\.?\\s+(\\d{4})(?:\\s+(\\d{1,2}:\\d{2}(?::\\d{2})?))?`,
      "i",
    ),
  );
  if (dayFirst) {
    const [, day, monthName, year, time] = dayFirst;
    const month = MONTH_INDEX[monthName.toLowerCase()];
    if (month) {
      return withTime(year, month, day.padStart(2, "0"), time);
    }
  }

  const monthFirst = dateStr.match(
    new RegExp(
      `(${months})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})(?:\\s+(\\d{1,2}:\\d{2}(?::\\d{2})?))?`,
      "i",
    ),
  );
  if (monthFirst) {
    const [, monthName, day, year, time] = monthFirst;
    const month = MONTH_INDEX[monthName.toLowerCase()];
    if (month) {
      return withTime(year, month, day.padStart(2, "0"), time);
    }
  }

  return null;
}
