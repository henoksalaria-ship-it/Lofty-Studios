'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/src/components/Icon'
import { signOut } from '@/app/actions'

const navigation = [
  ['Dashboard', '/dashboard', 'grid'], ['Pipeline', '/pipeline', 'funnel'], ['Companies', '/companies', 'building'], ['Outreach', '/outreach', 'send'], ['Finance', '/finance', 'wallet'], ['Calendar', '/calendar', 'calendar'], ['Notes', '/calendar', 'note'], ['Content', '/calendar', 'play'], ['Performance', '/performance', 'chart'], ['Reports', '/reports', 'bars'], ['Settings', '/settings', 'settings'],
]

export default function AppShell({ children, workspaceName, displayName }) {
  const pathname = usePathname()
  return <div className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand" aria-label="Lofty Studios"><span>LOFTY</span><small>STUDIOS</small></Link><nav className="nav-list" aria-label="Main navigation">{navigation.map(([label, href, icon]) => <Link key={`${label}-${icon}`} href={href} className={`nav-item ${pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`)) ? 'is-active' : ''}`}><Icon name={icon}/><span>{label}</span></Link>)}</nav><div className="profile"><span className="avatar">{displayName.slice(0, 2).toUpperCase()}</span><span className="profile-copy"><strong>{displayName}</strong><small>{workspaceName}</small><form action={signOut}><button className="sign-out-button" type="submit">Sign out</button></form></span></div></aside><main className="main-canvas"><div className="topbar"><Link className="mobile-brand" href="/dashboard">LOFTY</Link><Link className="new-lead-button" href="/pipeline/new"><Icon name="plus" size={18}/>New lead</Link></div><div className="app-content">{children}</div></main></div>
}
