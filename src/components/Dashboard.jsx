import Icon from './Icon.jsx'
import { SectionLabel } from './Ui.jsx'
import { schedule, stages } from '../data.js'

function TaskList({ tasks, onToggle }) {
  return <section className="panel task-panel"><SectionLabel action="View all">Today at Lofty</SectionLabel><div className="task-list">{tasks.map(task => <button className={`task-row ${task.done ? 'is-done' : ''}`} key={task.id} onClick={() => onToggle(task.id)}><span className="task-check"><Icon name="check" size={13}/></span><time>{task.time}</time><span className="task-copy"><strong>{task.title}</strong><small className={`tone-${task.tone}`}>{task.detail}</small></span></button>)}</div><button className="add-inline"><Icon name="plus" size={18}/>Add task</button></section>
}

function FinancePanel({ onFinance }) {
  return <section className="panel finance-panel"><SectionLabel action="View finance" onAction={onFinance}>Finance overview</SectionLabel><div className="eyebrow">Expected revenue · June</div><div className="revenue-line"><strong>ETB 1.86M</strong><span>expected</span></div><div className="progress"><i /></div><div className="progress-caption"><strong>62% of target</strong><span>Target: ETB 3.00M</span></div><div className="finance-split"><div><span>Collected</span><strong>ETB 1.12M</strong><small className="tone-lime">37% of target</small></div><div><span>Pending</span><strong>ETB 740K</strong><small className="tone-coral">25% of target</small></div></div><button className="footer-action" onClick={onFinance}><Icon name="wallet" size={16}/>View cash flow</button></section>
}

function PulsePanel({ onPipeline }) {
  const pulse = stages.slice(0, 4)
  return <section className="panel pulse-panel"><SectionLabel action="View pipeline" onAction={onPipeline}>Pipeline pulse</SectionLabel><div className="pulse-list">{pulse.map(stage => <div className="pulse-row" key={stage.key}><span className={`stage-icon ${stage.accent}`}><Icon name={stage.icon} size={17}/></span><span><strong>{stage.key}</strong><small>{stage.count} deals</small></span><em>{stage.amount}</em><b>{stage.count}</b></div>)}</div><div className="pulse-total"><strong>Total pipeline</strong><span><b>11</b> deals&nbsp;&nbsp; ETB 3.84M</span></div></section>
}

function MiniPipeline({ onPipeline }) {
  return <section className="panel open-pipeline"><SectionLabel action="View full pipeline" onAction={onPipeline}>Open pipeline</SectionLabel><div className="mini-pipeline-grid">{stages.slice(0, 4).map(stage => <div className="mini-stage" key={stage.key}><div className="mini-stage-heading"><span className={`stage-icon ${stage.accent}`}><Icon name={stage.icon} size={16}/></span><strong>{stage.key}</strong><b>{stage.count}</b><em>{stage.amount}</em></div>{stage.deals.slice(0, 4).map(([company, type, value]) => <button className="deal-mini" key={company}><span><strong>{company}</strong><small>{type}</small></span><b>{value}</b></button>)}</div>)}<button className="new-deal-tile" onClick={onPipeline}><Icon name="plus" size={27}/><span>New deal</span></button></div></section>
}

function SchedulePanel({ onCalendar }) {
  const days = [['Wed', '24'], ['Thu', '25'], ['Fri', '26'], ['Sat', '27'], ['Sun', '28']]
  const times = ['9 AM', '12 PM', '3 PM', '6 PM']
  return <section className="panel schedule-panel"><SectionLabel action="View calendar" onAction={onCalendar}>Content schedule</SectionLabel><div className="schedule-grid"><div className="time-spacer" />{days.map(([day, date]) => <div className="day-head" key={date}><span>{day}</span><b>{date}</b></div>)}{times.map(time => <><div className="time-label" key={`${time}-label`}>{time}</div>{days.map(([day, date]) => { const event = schedule.find(item => item.day === day && item.date === date && item.time === time); return <button className={`schedule-cell ${event ? `has-event ${event.tone}` : ''}`} key={`${day}-${time}`} onClick={onCalendar}>{event && <><strong>{event.title}</strong><small>{event.subtitle}</small></>}</button> })}</> )}</div></section>
}

function PerformancePanel({ onPerformance }) {
  return <section className="panel performance-panel"><SectionLabel action="View report" onAction={onPerformance}>Performance overview</SectionLabel><div className="chart-tools"><button>Revenue (ETB)⌄</button><button>This quarter⌄</button><span><i className="target-key"/>Target <i className="actual-key"/>Actual</span></div><div className="performance-main"><div className="chart-wrap"><svg viewBox="0 0 470 170" role="img" aria-label="Revenue performance chart"><g className="chart-grid"><path d="M0 145H470M0 105H470M0 65H470M0 25H470"/></g><polyline points="0,145 42,130 85,113 127,102 170,92 212,76 255,58 298,43 340,25 383,8" className="chart-target"/><polyline points="0,154 42,142 85,130 127,112 170,104 212,91 255,78 298,65 340,52 383,42" className="chart-actual"/>{[[42,142],[85,130],[127,112],[170,104],[212,91],[255,78],[298,65],[340,52],[383,42]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="4" className="chart-dot"/>)}</svg><div className="chart-months"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div></div><div className="performance-kpis"><span>YTD revenue</span><strong>ETB 1.12M</strong><small className="tone-lime">37% of target</small><hr/><span>Deals won</span><strong>8</strong><small className="tone-lime">+33% vs last quarter</small></div></div></section>
}

export default function Dashboard({ tasks, onToggleTask, onNavigate }) {
  return <><header className="dashboard-heading"><div><h1>Good morning, Haron</h1><p>Wednesday, June 24</p></div><div className="header-actions"><label className="search-box"><Icon name="search" size={18}/><input placeholder="Search…" /></label><button className="icon-button"><Icon name="bell"/><i /></button><button className="icon-button"><Icon name="message"/></button></div></header><div className="dash-grid top-grid"><TaskList tasks={tasks} onToggle={onToggleTask}/><FinancePanel onFinance={() => onNavigate('Finance')}/><PulsePanel onPipeline={() => onNavigate('Pipeline')}/></div><MiniPipeline onPipeline={() => onNavigate('Pipeline')}/><div className="dash-grid lower-grid"><SchedulePanel onCalendar={() => onNavigate('Calendar')}/><PerformancePanel onPerformance={() => onNavigate('Performance')}/></div></>
}
