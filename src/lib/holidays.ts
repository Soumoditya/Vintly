// Indian holidays & festivals shown on the calendar (like Google Calendar).
// National/fixed dates are exact; lunar festival dates are best-known estimates
// and may shift by a day regionally.

export type HolidayType = 'national' | 'festival'
export interface Holiday { date: string; name: string; type: HolidayType }

export const HOLIDAYS: Holiday[] = [
  // ---- 2026 ----
  { date: '2026-01-01', name: 'New Year’s Day', type: 'national' },
  { date: '2026-01-13', name: 'Lohri', type: 'festival' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', type: 'festival' },
  { date: '2026-01-23', name: 'Basant Panchami', type: 'festival' },
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-02-15', name: 'Maha Shivaratri', type: 'festival' },
  { date: '2026-03-03', name: 'Holika Dahan', type: 'festival' },
  { date: '2026-03-04', name: 'Holi', type: 'festival' },
  { date: '2026-03-21', name: 'Eid-ul-Fitr', type: 'festival' },
  { date: '2026-03-26', name: 'Ram Navami', type: 'festival' },
  { date: '2026-03-31', name: 'Mahavir Jayanti', type: 'festival' },
  { date: '2026-04-02', name: 'Hanuman Jayanti', type: 'festival' },
  { date: '2026-04-03', name: 'Good Friday', type: 'festival' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti / Baisakhi', type: 'national' },
  { date: '2026-05-01', name: 'May Day', type: 'national' },
  { date: '2026-05-01', name: 'Buddha Purnima', type: 'festival' },
  { date: '2026-05-27', name: 'Bakrid (Eid-ul-Adha)', type: 'festival' },
  { date: '2026-06-26', name: 'Muharram', type: 'festival' },
  { date: '2026-06-29', name: 'Rath Yatra', type: 'festival' },
  { date: '2026-07-29', name: 'Guru Purnima', type: 'festival' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-08-26', name: 'Raksha Bandhan', type: 'festival' },
  { date: '2026-08-28', name: 'Onam', type: 'festival' },
  { date: '2026-09-04', name: 'Janmashtami', type: 'festival' },
  { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'festival' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-11', name: 'Navratri begins', type: 'festival' },
  { date: '2026-10-17', name: 'Durga Puja — Shashthi', type: 'festival' },
  { date: '2026-10-18', name: 'Durga Puja — Saptami', type: 'festival' },
  { date: '2026-10-19', name: 'Durga Puja — Ashtami', type: 'festival' },
  { date: '2026-10-20', name: 'Durga Puja — Navami', type: 'festival' },
  { date: '2026-10-20', name: 'Dussehra (Vijayadashami)', type: 'festival' },
  { date: '2026-10-27', name: 'Karva Chauth', type: 'festival' },
  { date: '2026-11-06', name: 'Dhanteras', type: 'festival' },
  { date: '2026-11-08', name: 'Diwali (Deepavali)', type: 'festival' },
  { date: '2026-11-09', name: 'Govardhan Puja', type: 'festival' },
  { date: '2026-11-10', name: 'Bhai Dooj', type: 'festival' },
  { date: '2026-11-15', name: 'Chhath Puja', type: 'festival' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'festival' },
  { date: '2026-12-25', name: 'Christmas', type: 'national' },
  // ---- early 2027 (so the calendar isn't empty next year) ----
  { date: '2027-01-01', name: 'New Year’s Day', type: 'national' },
  { date: '2027-01-26', name: 'Republic Day', type: 'national' },
  { date: '2027-03-22', name: 'Holi', type: 'festival' },
]

const byDate = new Map<string, Holiday[]>()
for (const h of HOLIDAYS) {
  const arr = byDate.get(h.date) || []
  arr.push(h)
  byDate.set(h.date, arr)
}

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function holidaysOn(d: Date): Holiday[] {
  return byDate.get(key(d)) || []
}
