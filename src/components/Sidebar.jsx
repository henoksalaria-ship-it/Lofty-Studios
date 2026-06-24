import Icon from './Icon.jsx'
import { navigation } from '../data.js'

export default function Sidebar({ activePage, onNavigate }) {
  return <aside className="sidebar">
    <div className="brand" aria-label="Lofty Studios">
      <span>LOFTY</span><small>STUDIOS</small>
    </div>
    <nav className="nav-list" aria-label="Main navigation">
      {navigation.map(([label, icon]) => <button key={label} className={`nav-item ${activePage === label ? 'is-active' : ''}`} onClick={() => onNavigate(label)}><Icon name={icon}/><span>{label}</span></button>)}
    </nav>
    <button className="profile" onClick={() => onNavigate('Settings')}>
      <span className="avatar">HS</span><span className="profile-copy"><strong>Haron Solomon</strong><small>Founder</small></span><Icon name="arrow" size={14}/>
    </button>
  </aside>
}
