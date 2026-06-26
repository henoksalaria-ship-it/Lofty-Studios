'use client'

import { useState, useTransition } from 'react'
import Icon from '@/src/components/Icon'
import { updateDealStage } from '@/app/actions'
import { money, STAGE_LABELS, STAGE_ORDER } from '@/lib/format'

const stageIcons = { cold_leads: ['target', 'lime'], reached_out: ['message', 'purple'], open_deals: ['handshake', 'coral'], ongoing_deals: ['file', 'purple'], waiting_payment: ['wallet', 'lime'], closed_won: ['check', 'lime'], lost_not_now: ['close', 'muted'] }
const channelLabels = { call: 'Call', email: 'Email', dm: 'DM', whatsapp: 'WhatsApp', meeting: 'Meeting', proposal: 'Proposal' }

export default function PipelineBoard({ deals }) {
  const [draggedDealId, setDraggedDealId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)
  const [query, setQuery] = useState('')
  const [, startTransition] = useTransition()
  const normalizedQuery = query.trim().toLowerCase()
  const filteredDeals = normalizedQuery
    ? deals.filter((deal) => {
      const searchable = [
        deal.deal_title,
        deal.companies?.company_name,
        deal.source,
        deal.temperature,
        STAGE_LABELS[deal.stage],
        deal.value,
        deal.last_outreach?.channel,
        deal.last_outreach?.outcome,
        deal.last_outreach?.message,
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(normalizedQuery)
    })
    : deals
  const openValue = deals.filter((deal) => !['closed_won', 'lost_not_now'].includes(deal.stage)).reduce((sum, deal) => sum + Number(deal.value || 0), 0)

  function moveDeal(stage) {
    if (!draggedDealId || !stage) return
    const formData = new FormData()
    formData.set('deal_id', draggedDealId)
    formData.set('stage', stage)
    startTransition(() => updateDealStage(formData))
    setDraggedDealId(null)
    setActiveDropStage(null)
  }
  return <><div className="pipeline-toolbar"><label className="search-box"><Icon name="search" size={17}/><input placeholder="Search deals, companies, stages, sources, or outreach" value={query} onChange={(event) => setQuery(event.target.value)} /></label><span className="pipeline-value">{normalizedQuery ? `${filteredDeals.length} of ${deals.length} deals` : 'Open pipeline'} <strong>{money(openValue)}</strong></span></div><p className="pipeline-hint">Drag a deal from one stage to another. Latest outreach appears on each deal when a touch has been logged.</p><section className="pipeline-board">{STAGE_ORDER.map((stage) => { const [icon, tone] = stageIcons[stage]; const stageDeals = filteredDeals.filter((deal) => deal.stage === stage); const total = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0); return <div className={`pipeline-column ${activeDropStage === stage ? 'drop-active' : ''}`} key={stage} onDragOver={(event) => { event.preventDefault(); setActiveDropStage(stage) }} onDragLeave={() => setActiveDropStage(null)} onDrop={() => moveDeal(stage)}><div className="column-heading"><span className={`stage-icon ${tone}`}><Icon name={icon} size={16}/></span><strong>{STAGE_LABELS[stage]}</strong><b>{stageDeals.length}</b></div><div className="column-amount">{money(total)}</div><div className="deal-stack">{stageDeals.map((deal) => <article className="deal-card" draggable key={deal.id} onDragStart={() => setDraggedDealId(deal.id)}><div><span className={`status-dot ${deal.temperature === 'warm' ? 'warm' : deal.temperature === 'cold' ? 'cold' : ''}`}></span><small>{deal.probability ? `${deal.probability}% close probability` : 'Needs qualification'}</small><button type="button" aria-label={`More actions for ${deal.deal_title}`}>{<Icon name="dots" size={15}/>}</button></div><h3>{deal.companies?.company_name || deal.deal_title}</h3><p>{deal.deal_title}</p>{deal.last_outreach ? <small className="deal-touch">{channelLabels[deal.last_outreach.channel] || deal.last_outreach.channel}: {deal.last_outreach.outcome || deal.last_outreach.message || 'Logged touch'}</small> : null}<footer><span>{deal.source?.replace('_', ' ') || 'Direct'}</span><strong>{money(deal.value)}</strong></footer></article>)}</div><span className="add-deal-column">Drag deals here</span></div> })}</section></>
}
