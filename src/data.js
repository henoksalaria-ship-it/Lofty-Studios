export const navigation = [
  ['Dashboard', 'grid'],
  ['Pipeline', 'funnel'],
  ['Companies', 'building'],
  ['Outreach', 'send'],
  ['Finance', 'wallet'],
  ['Calendar', 'calendar'],
  ['Notes', 'note'],
  ['Content', 'play'],
  ['Performance', 'chart'],
  ['Reports', 'bars'],
  ['Settings', 'settings'],
]

export const tasksSeed = [
  { id: 1, time: '9:00 AM', title: 'Intro call with Hey Mobile', detail: 'Discovery call', tone: 'purple', done: false },
  { id: 2, time: '10:30 AM', title: 'Send proposal to Habesha Cement', detail: 'Proposal follow-up', tone: 'coral', done: false },
  { id: 3, time: '12:00 PM', title: 'Content review — Kegna Beverages', detail: 'Internal review', tone: 'purple', done: false },
  { id: 4, time: '2:00 PM', title: 'Call with Ethio Telecom', detail: 'Partnership discussion', tone: 'purple', done: false },
  { id: 5, time: '4:30 PM', title: 'Approve Q3 content calendar', detail: 'Completed', tone: 'muted', done: true },
]

export const stages = [
  { key: 'Cold leads', icon: 'target', amount: 'ETB 1.25M', count: 4, accent: 'lime', deals: [['Hey Mobile', 'Brand campaign', 'ETB 450K'], ['Habesha Cement', 'Corporate film', 'ETB 300K'], ['Ethio Telecom', 'Product launch video', 'ETB 280K'], ['Dashen Bank', 'Social media series', 'ETB 220K']] },
  { key: 'Reached out', icon: 'message', amount: 'ETB 870K', count: 3, accent: 'purple', deals: [['Kegna Beverages', 'TV commercial', 'ETB 500K'], ['Awash Bank', 'Brand story', 'ETB 220K'], ['Zemen Insurance', 'Explainer video', 'ETB 150K']] },
  { key: 'Open deals', icon: 'handshake', amount: 'ETB 620K', count: 2, accent: 'coral', deals: [['Safaricom Ethiopia', 'Campaign production', 'ETB 400K'], ['National Lottery', 'TVC + Digital', 'ETB 220K']] },
  { key: 'Ongoing', icon: 'file', amount: 'ETB 1.10M', count: 2, accent: 'purple', deals: [['Kegna Beverages', 'Annual retainer', 'ETB 650K'], ['Heineken Ethiopia', 'Brand film', 'ETB 450K']] },
  { key: 'Waiting payment', icon: 'wallet', amount: 'ETB 360K', count: 2, accent: 'lime', deals: [['Fana Broadcasting', 'Social mini-series', 'ETB 220K'], ['Hibret Bank', 'Product reel set', 'ETB 140K']] },
  { key: 'Closed / won', icon: 'check', amount: 'ETB 1.58M', count: 4, accent: 'lime', deals: [['Coca-Cola Ethiopia', 'Summer activation', 'ETB 800K'], ['Meklit Coffee', 'Launch film', 'ETB 280K']] },
  { key: 'Lost / not now', icon: 'x', amount: 'ETB 440K', count: 2, accent: 'muted', deals: [['Toyota Ethiopia', 'Creator campaign', 'ETB 350K'], ['Liya Soap', 'Social package', 'ETB 90K']] },
]

export const schedule = [
  { day: 'Wed', date: '24', time: '9 AM', title: 'Hey Mobile', subtitle: 'Shoot — Day 1', tone: 'purple' },
  { day: 'Wed', date: '24', time: '12 PM', title: 'Kegna Beverages', subtitle: 'Edit review', tone: 'lime' },
  { day: 'Wed', date: '24', time: '3 PM', title: 'Habesha Cement', subtitle: 'Script writing', tone: 'coral' },
  { day: 'Thu', date: '25', time: '9 AM', title: 'Hey Mobile', subtitle: 'Shoot — Day 2', tone: 'purple' },
  { day: 'Thu', date: '25', time: '12 PM', title: 'Internal', subtitle: 'Team sync', tone: 'purple' },
  { day: 'Thu', date: '25', time: '3 PM', title: 'Kegna Beverages', subtitle: 'VO recording', tone: 'lime' },
  { day: 'Fri', date: '26', time: '9 AM', title: 'Habesha Cement', subtitle: 'Creative review', tone: 'coral' },
  { day: 'Fri', date: '26', time: '12 PM', title: 'Hey Mobile', subtitle: 'Rough cut', tone: 'purple' },
  { day: 'Fri', date: '26', time: '3 PM', title: 'Ethio Telecom', subtitle: 'Concept review', tone: 'purple' },
  { day: 'Sat', date: '27', time: '12 PM', title: 'Buffer', subtitle: 'Content prep', tone: 'muted' },
  { day: 'Sun', date: '28', time: '12 PM', title: 'Buffer', subtitle: 'Planning', tone: 'muted' },
]

export const ideaSeed = [
  { id: 'i1', title: 'Make someone laugh in 10 seconds', client: 'Hey Mobile', column: 'Raw ideas', tone: 'lime' },
  { id: 'i2', title: 'The true cost of a wedding', client: 'Lofty Talk', column: 'Scripts needed', tone: 'purple' },
  { id: 'i3', title: 'One day as a barista', client: 'Meklit Coffee', column: 'Ready to shoot', tone: 'coral' },
  { id: 'i4', title: 'How we made this look expensive', client: 'Lofty Studios', column: 'Finalized', tone: 'purple' },
]
