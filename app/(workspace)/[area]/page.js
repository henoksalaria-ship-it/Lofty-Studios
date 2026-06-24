import { notFound } from 'next/navigation'

const pages = {
  outreach: ['Outreach', 'Log calls, DMs, emails, and follow-ups against every deal. This is the next operational slice after pipeline and finance.'],
  reports: ['Reports', 'Client-ready campaign reports and revenue summaries will use the same live deal, finance, and performance data.'],
  settings: ['Settings', 'Team roles, workspace preferences, templates, and integrations live here.'],
}

export default async function AreaPage({ params }) {
  const { area } = await params
  const page = pages[area]
  if (!page) notFound()
  return <section className="empty-state"><div className="empty-mark">+</div><h1>{page[0]}</h1><p>{page[1]}</p></section>
}
