'use client'

import { useState, useTransition } from 'react'
import Icon from '@/src/components/Icon'
import { scheduleContentIdea } from '@/app/actions'

const columns = [
  ['idea', 'Raw ideas', 'lime'], ['scripted', 'Scripts needed', 'purple'], ['ready_to_shoot', 'Ready to shoot', 'coral'], ['ready', 'Finalized', 'purple'],
]

function dayKey(value) {
  return new Date(value).toLocaleDateString('en-CA')
}

export default function ContentPlanner({ workspaceId, ideas, events }) {
  const [draggedIdea, setDraggedIdea] = useState(null)
  const [isPending, startTransition] = useTransition()
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    date.setHours(12, 0, 0, 0)
    return date
  })
  function dropOnDay(date) {
    if (!draggedIdea) return
    const formData = new FormData()
    formData.set('workspace_id', workspaceId)
    formData.set('content_idea_id', draggedIdea.id)
    formData.set('title', draggedIdea.title)
    formData.set('start_date', date.toISOString())
    startTransition(() => scheduleContentIdea(formData))
    setDraggedIdea(null)
  }
  return <section className="calendar-layout" style={{ marginTop: 8 }}><section className="planner"><div className="calendar-topline"><div><strong>Next 7 days</strong></div><span>{isPending ? 'Scheduling…' : 'Drag an idea onto a day'}</span></div><div className="planner-grid"><div className="time-spacer"/>{days.map((day, index) => <div className={`planner-day ${index === 0 ? 'is-today' : ''}`} key={day.toISOString()}><span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>{day.getDate()}</strong></div>)}<div className="planner-time">Schedule</div>{days.map((day) => { const matchingEvents = events.filter((event) => dayKey(event.start_date) === dayKey(day)); return <div className="drop-zone" key={day.toISOString()} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOnDay(day)}>{matchingEvents.map((event) => <div className="plan-event purple" key={event.id}><span>{event.title}</span><small>{event.event_type.replaceAll('_', ' ')}</small></div>)}</div> })}</div></section><aside className="ideas-panel"><div className="ideas-heading"><div><span className="eyebrow">Drag & drop planning</span><h2>Ideas in motion</h2></div><Icon name="note" size={19}/></div><p>When an idea is ready, drop it onto a day. That creates the calendar event and preserves the content record.</p><div className="idea-columns">{columns.map(([status, label, tone]) => { const items = ideas.filter((idea) => idea.status === status); return <div className="idea-column" key={status}><h3>{label}<span>{items.length}</span></h3>{items.map((idea) => <article className={`idea-card ${tone}`} key={idea.id} draggable onDragStart={() => setDraggedIdea(idea)}><span className="drag-grip">⠿</span><strong>{idea.title}</strong><small>{idea.platform || idea.content_type || 'Unassigned format'}</small></article>)}</div> })}</div></aside></section>
}
