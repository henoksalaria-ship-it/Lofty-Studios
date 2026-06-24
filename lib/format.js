export const STAGE_ORDER = ['cold_leads', 'reached_out', 'open_deals', 'ongoing_deals', 'waiting_payment', 'closed_won', 'lost_not_now']

export const STAGE_LABELS = {
  cold_leads: 'Cold leads', reached_out: 'Reached out', open_deals: 'Open deals', ongoing_deals: 'Ongoing', waiting_payment: 'Waiting payment', closed_won: 'Closed / won', lost_not_now: 'Lost / not now',
}

export function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(Number(value || 0)).replace('ETB', 'ETB ')
}

export function shortDate(value) {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function percent(value) {
  return `${Math.round(Number(value || 0))}%`
}
