'use client'

import { useMemo, useState, useTransition } from 'react'
import Icon from '@/src/components/Icon'
import { updateDealStage } from '@/app/actions'
import { money, STAGE_LABELS, STAGE_ORDER } from '@/lib/format'

const stageIcons = { cold_leads: ['target', 'lime'], reached_out: ['message', 'purple'], open_deals: ['handshake', 'coral'], ongoing_deals: ['file', 'purple'], waiting_payment: ['wallet', 'lime'], closed_won: ['check', 'lime'], lost_not_now: ['close', 'muted'] }
const channelLabels = { call: 'Call', email: 'Email', dm: 'DM', whatsapp: 'WhatsApp', meeting: 'Meeting', proposal: 'Proposal' }
const financeLabels = { all: 'All payments', none: 'No finance', unpaid: 'Unpaid', overdue: 'Overdue', paid: 'Paid' }

export default function PipelineBoard({ deals }) {
  const [draggedDealId, setDraggedDealId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ stage: 'all', temperature: 'all', source: 'all', owner: 'all', finance: 'all' })
  const [moveStatus, setMoveStatus] = useState(null)
  const [, startTransition] = useTransition()

  const sources = useMemo(() => [...new Set(deals.map((deal) => deal.source).filter(Boolean))].sort(), [deals])
  const owners = useMemo(() => [...new Set(deals.map((deal) => deal.owner_id).filter(Boolean))], [deals])
  const normalizedQuery = query.trim().toLowerCase()
  const filteredDeals = deals.filter((deal) => {
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
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return false
    if (filters.stage !== 'all' && deal.stage !== filters.stage) return false
    if (filters.temperature !== 'all' && deal.temperature !== filters.temperature) return false
    if (filters.source !== 'all' && deal.source !== filters.source) return false
    if (filters.owner !== 'all' && deal.owner_id !== filters.owner) return false
    if (filters.finance !== 'all' && deal.finance_status !== filters.finance) return false
    return true
  })
  const openValue = deals.filter((deal) => !['closed_won', 'lost_not_now'].includes(deal.stage)).reduce((sum, deal) => sum + Number(deal.value || 0), 0)

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function moveDeal(stage) {
    if (!draggedDealId || !stage) return
    const deal = deals.find((item) => item.id === draggedDealId)
    const formData = new FormData()
    formData.set('deal_id', draggedDealId)
    formData.set('stage', stage)
    setMoveStatus({ state: 'saving', message: `Moving ${deal?.deal_title || 'deal'}...` })
    startTransition(() => {
      updateDealStage(formData)
        .then(() => setMoveStatus({ state: 'success', message: `${deal?.deal_title || 'Deal'} moved to ${STAGE_LABELS[stage]}.` }))
        .catch((error) => setMoveStatus({ state: 'error', message: error.message || 'Could not move deal.' }))
    })
    setDraggedDealId(null)
    setActiveDropStage(null)
  }

  return <>
    <div className="pipeline-toolbar v2-toolbar">
      <label className="search-box"><Icon name="search" size={17}/><input placeholder="Search deals, companies, stages, sources, or outreach" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select className="filter-button" value={filters.stage} onChange={(event) => setFilter('stage', event.target.value)}><option value="all">All stages</option>{STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}</select>
      <select className="filter-button" value={filters.temperature} onChange={(event) => setFilter('temperature', event.target.value)}><option value="all">All temperatures</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></select>
      <select className="filter-button" value={filters.source} onChange={(event) => setFilter('source', event.target.value)}><option value="all">All sources</option>{sources.map((source) => <option key={source} value={source}>{source.replace('_', ' ')}</option>)}</select>
      <select className="filter-button" value={filters.owner} onChange={(event) => setFilter('owner', event.target.value)}><option value="all">All owners</option>{owners.map((owner, index) => <option key={owner} value={owner}>Owner {index + 1}</option>)}</select>
      <select className="filter-button" value={filters.finance} onChange={(event) => setFilter('finance', event.target.value)}>{Object.entries(financeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <span className="pipeline-value">{normalizedQuery || Object.values(filters).some((value) => value !== 'all') ? `${filteredDeals.length} of ${deals.length} deals` : 'Open pipeline'} <strong>{money(openValue)}</strong></span>
    </div>
    {moveStatus ? <div className={`pipeline-status is-${moveStatus.state}`}>{moveStatus.message}</div> : null}
    <p className="pipeline-hint">Drag a deal from one stage to another. Cards show next action, duplicate warnings, and finance status.</p>
    <section className="pipeline-board">{STAGE_ORDER.map((stage) => {
      const [icon, tone] = stageIcons[stage]
      const stageDeals = filteredDeals.filter((deal) => deal.stage === stage)
      const total = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)
      return <div className={`pipeline-column ${activeDropStage === stage ? 'drop-active' : ''}`} key={stage} onDragOver={(event) => { event.preventDefault(); setActiveDropStage(stage) }} onDragLeave={() => setActiveDropStage(null)} onDrop={() => moveDeal(stage)}>
        <div className="column-heading"><span className={`stage-icon ${tone}`}><Icon name={icon} size={16}/></span><strong>{STAGE_LABELS[stage]}</strong><b>{stageDeals.length}</b></div>
        <div className="column-amount">{money(total)}</div>
        <div className="deal-stack">{stageDeals.map((deal) => <article className="deal-card" draggable key={deal.id} onDragStart={() => setDraggedDealId(deal.id)}>
          <div><span className={`status-dot ${deal.temperature === 'warm' ? 'warm' : deal.temperature === 'cold' ? 'cold' : ''}`}></span><small>{deal.probability ? `${deal.probability}% close probability` : 'Needs qualification'}</small><button type="button" aria-label={`More actions for ${deal.deal_title}`}>{<Icon name="dots" size={15}/>}</button></div>
          <h3>{deal.companies?.company_name || deal.deal_title}</h3>
          <p>{deal.deal_title}</p>
          <div className="deal-badges">
            <span className={`deal-badge finance-${deal.finance_status || 'none'}`}>{financeLabels[deal.finance_status || 'none'] || 'Finance'}</span>
            {deal.duplicate_warning?.length ? <span className="deal-badge warn">Duplicate warning</span> : null}
            {deal.finance_checks?.length ? <span className="deal-badge danger">{deal.finance_checks.length} balance check{deal.finance_checks.length === 1 ? '' : 's'}</span> : null}
          </div>
          {deal.last_outreach ? <small className="deal-touch">{channelLabels[deal.last_outreach.channel] || deal.last_outreach.channel}: {deal.last_outreach.outcome || deal.last_outreach.message || 'Logged touch'}</small> : <small className="deal-touch muted">Next action needed</small>}
          <footer><span>{deal.source?.replace('_', ' ') || 'Direct'}</span><strong>{money(deal.value)}</strong></footer>
        </article>)}</div>
        <span className="add-deal-column">Drag deals here</span>
      </div>
    })}</section>
  </>
}
