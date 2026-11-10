import { Appointment, PricePoint, Procedure } from '../types';

/** Istoricul sortat după data de început. Serviciile vechi (doar `price`) au o singură intrare, valabilă mereu. */
export function priceHistory(p: Procedure): PricePoint[] {
  if (p.prices && p.prices.length) return [...p.prices].sort((a, b) => a.from.localeCompare(b.from));
  return p.price !== undefined ? [{ from: '', price: p.price }] : [];
}

/** Prețul serviciului valabil la data dată (YYYY-MM-DD). */
export function priceOn(p: Procedure | undefined, date: string): number | undefined {
  if (!p) return undefined;
  const h = priceHistory(p);
  let out: number | undefined;
  for (const x of h) if (x.from <= date) out = x.price;
  // data e înaintea primului preț → folosim primul preț cunoscut
  return out ?? h[0]?.price;
}

/** Adaugă un preț nou valabil de la `from`; un preț cu aceeași dată îl înlocuiește. `price` rămâne prețul de azi (compatibilitate). */
export function addPrice(p: Procedure, from: string, price: number, today: string): Procedure {
  const h = priceHistory(p);
  // primul preț se aplică și programărilor dinainte de data lui (vezi priceOn)
  const entry: PricePoint = { from, price, changedAt: today };
  const prices = [...h.filter((x) => x.from !== entry.from), entry].sort((a, b) => a.from.localeCompare(b.from));
  const next = { ...p, prices };
  return { ...next, price: priceOn(next, today) };
}

/**
 * Programările care trebuie să primească prețul nou: încă „programat”, de la data prețului (și nu din trecut),
 * la același serviciu și care au încă prețul vechi (adică nu au fost modificate de mână).
 */
export function affectedByPrice(appts: Appointment[], before: Procedure, from: string, today: string): Appointment[] {
  const start = from > today ? from : today;
  return appts.filter((a) => !a.deleted && a.procedureId === before.id && a.status === 'programat' && a.date >= start
    && a.price !== undefined && a.price === priceOn(before, a.date));
}
