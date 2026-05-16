export function isValidDateParts(year: string, month: string, day: string) {
  const yearValue = Number(year);
  const monthValue = Number(month);
  const dayValue = Number(day);
  if (monthValue < 1 || monthValue > 12 || dayValue < 1) {
    return false;
  }

  return dayValue <= new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
}
