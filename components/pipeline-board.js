'use client'

import { useState, useTransition } from 'react'
import Icon from '@/src/components/Icon'
import { updateDealStage } from '@/app/actions'
import { money, STAGE_LABELS, STAGE_ORDER } from '@/lib/format'

const stageIcons = { cold_leads: ['target', 'lime'], reached_out: ['message', 'purple'], open_deals: ['handshake', 'coral'], ongoing_deals: ['file', 'purple'], waiting_payment: ['wallet', 'lime'], closed_won: ['check', 'lime'], lost_not_now: ['close', 'muted'] }

export default function PipelineBoard({ deals }) {
  const [draggedDealId, setDraggedDealId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)
  const [, startTransition] = useTransition()
  function moveDeal(stage) {
    if (!draggedDealId || !stage) return
    const formData = new FormData()
    formData.set('deal_id', draggedDealId)
    formData.set('stage', stage)
    startTransition(() => updateDealStage(formData))
    setDraggedDealId(null)
    setActiveDropStage(null)
  }
  return <section className="pipeline-board">{STAGE_ORDER.map((stage) => { const [icon, tone] = stageIcons[stage]; const stageDeals = deals.filter((deal) => deal.stage === stage); const total = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0); return <div className={`pipeline-column ${activeDropStage === stage ? 'drop-active' : ''}`} key={stage} onDragOver={(event) => { event.preventDefault(); setActiveDropStage(stage) }} onDragLeave={() => setActiveDropStage(null)} onDrop={() => moveDeal(stage)}><div className="column-heading"><span className={`stage-icon ${tone}`}><Icon name={icon} size={16}/></span><strong>{STAGE_LABELS[stage]}</strong><b>{stageDeals.length}</b></div><div className="column-amount">{money(total)}</div><div className="deal-stack">{stageDeals.map((deal) => <article className="deal-card" draggable key={deal.id} onDragStart={() => setDraggedDealId(deal.id)}><div><span className={`status-dot ${deal.temperature === 'warm' ? 'warm' : deal.temperature === 'cold' ? 'cold' : ''}`}></span><small>{deal.probability ? `${deal.probability}% close probability` : 'Needs qualification'}</small><button type="button" aria-label={`More actions for ${deal.deal_title}`}>{<Icon name="dots" size={15}/>}</button></div><h3>{deal.companies?.company_name || deal.deal_title}</h3><p>{deal.deal_title}</p><footer><span>{deal.source?.replace('_', ' ') || 'Direct'}</span><strong>{money(deal.value)}</strong></footer></article>)}</div><span className="add-deal-column">Drag deals here</span></div> })}</section>
}
