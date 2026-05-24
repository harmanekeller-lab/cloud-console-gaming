export const TICKETS = {
  flash: { label: "FLASH", duration: "2H", seconds: 2 * 3600, price: 1500, tagline: "Quick burst session" },
  gamer: { label: "GAMER", duration: "4H20", seconds: 4 * 3600 + 20 * 60, price: 3000, tagline: "Afternoon grind" },
  hardcore: { label: "HARDCORE", duration: "8H", seconds: 8 * 3600, price: 5000, tagline: "All-night marathon" },
} as const;

export type TicketKey = keyof typeof TICKETS;

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
