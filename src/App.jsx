import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Pipeline from './components/Pipeline.jsx'
import CalendarPlanner from './components/CalendarPlanner.jsx'
import Performance from './components/Performance.jsx'
import Icon from './components/Icon.jsx'
import { EmptyState } from './components/Ui.jsx'
import { tasksSeed } from './data.js'

function LeadDrawer({ onClose }) {
  const [created, setCreated] = useState(false)
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="lead-drawer" onMouseDown={event => event.stopPropagation()}><button className="drawer-close" onClick={onClose}><Icon name="close"/></button>{created ? <div className="drawer-success"><span><Icon name="check" size={26}/></span><h2>Lead added to the pipeline</h2><p>It has been placed in Cold leads and a follow-up task is ready for today.</p><button className="primary-button" onClick={onClose}>Done</button></div> : <><span className="eyebrow">Website-to-pipeline ready</span><h2>Capture a new lead</h2><p>Company details become a deal, task, and dashboard signal in one step.</p><form onSubmit={event => { event.preventDefault(); setCreated(true) }}><label>Company name<input required placeholder="e.g. Nib Insurance"/></label><label>Contact person<input required placeholder="Full name"/></label><div className="form-two"><label>Deal value<input placeholder="ETB 0"/></label><label>Source<select defaultValue="Website"><option>Website</option><option>Referral</option><option>DM</option><option>Cold outreach</option></select></label></div><label>What do they need?<textarea placeholder="Campaign, production, social content…"/></label><button className="primary-button" type="submit"><Icon name="plus" size={17}/>Create lead</button></form></>}</aside></div>
}

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [tasks, setTasks] = useState(tasksSeed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleTask = (taskId) => setTasks(current => current.map(task => task.id === taskId ? { ...task, done: !task.done } : task))
  let content
  if (activePage === 'Dashboard') content = <Dashboard tasks={tasks} onToggleTask={toggleTask} onNavigate={setActivePage}/>
  else if (activePage === 'Pipeline') content = <Pipeline onNewLead={() => setDrawerOpen(true)}/>
  else if (activePage === 'Calendar' || activePage === 'Notes' || activePage === 'Content') content = <CalendarPlanner/>
  else if (activePage === 'Performance') content = <Performance/>
  else content = <EmptyState title={`${activePage} is taking shape`} copy="This command center is designed to grow in focused releases. The core workflow is ready — next, connect the live Supabase data layer." action="Add a lead" onAction={() => setDrawerOpen(true)}/>
  return <div className="app-shell"><Sidebar activePage={activePage} onNavigate={setActivePage}/><main className="main-canvas"><div className="topbar"><button className="mobile-brand" onClick={() => setActivePage('Dashboard')}>LOFTY</button><button className="new-lead-button" onClick={() => setDrawerOpen(true)}><Icon name="plus" size={18}/>New lead</button></div>{content}</main>{drawerOpen && <LeadDrawer onClose={() => setDrawerOpen(false)}/>}</div>
}
