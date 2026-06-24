import Icon from './Icon.jsx'

export function SectionLabel({ children, action, onAction }) {
  return <div className="section-label"><h2>{children}</h2>{action && <button className="text-action" onClick={onAction}>{action}<Icon name="arrow" size={13}/></button>}</div>
}

export function EmptyState({ title, copy, action, onAction }) {
  return <section className="empty-state"><div className="empty-mark"><Icon name="plus" size={25}/></div><h1>{title}</h1><p>{copy}</p>{action && <button className="primary-button" onClick={onAction}><Icon name="plus" size={17}/>{action}</button>}</section>
}

export function PageHeading({ title, description, action, onAction }) {
  return <header className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <button className="primary-button" onClick={onAction}><Icon name="plus" size={17}/>{action}</button>}</header>
}
