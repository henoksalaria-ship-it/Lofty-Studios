const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  funnel: <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/>,
  building: <><path d="M4 21V5l8-2v18M4 11h16v10M8 7h1M8 11h1M8 15h1M15 14h2M15 18h2"/><path d="M11 21v-3h2v3"/></>,
  send: <path d="m21 3-7.8 18-3.4-7.8L3 9.8 21 3Zm-11.2 10.2L14 9"/>,
  wallet: <><path d="M4 7h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12"/><path d="M16 14h3"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  note: <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></>,
  play: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 9 5 3-5 3V9Z"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m6 15 4-5 3 2 5-7"/></>,
  bars: <><path d="M4 20V10M10 20V4M16 20v-7M22 20v-14"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3v-.1A1.7 1.7 0 0 0 10.7 18.6a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.06 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3h.1A1.7 1.7 0 0 0 7.06 9.94a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z"/></>,
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M22 12h-2M12 22v-2M2 12h2"/></>,
  message: <><path d="M20 15a4 4 0 0 1-4 4H8l-5 3 1.7-4A7 7 0 0 1 4 15V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7Z"/><path d="M8 11h8M8 15h5"/></>,
  handshake: <><path d="m8 12 2 2a2 2 0 0 0 3 0l3-3"/><path d="m8 12-1 1a2 2 0 0 0 3 3l1 1a2 2 0 0 0 3 0l1-1a2 2 0 0 0 3-3l-4-4-2 2-2-2-4 4a2 2 0 0 0 2 3"/><path d="m5 9-2-2 4-4 3 3M19 9l2-2-4-4-3 3"/></>,
  file: <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  x: <path d="m7 7 10 10M17 7 7 17"/>,
  search: <><circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  arrow: <path d="m8 5 7 7-7 7"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  dots: <path d="M5 12h.01M12 12h.01M19 12h.01"/>,
}

export default function Icon({ name, size = 18, stroke = 1.7 }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.grid}</svg>
}
