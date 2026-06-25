'use client'

export default function WorkspaceError({ error, reset }) {
  return <section className="empty-state">
    <div className="empty-mark">!</div>
    <h1>Something needs attention</h1>
    <p>{error?.message || 'The action could not be completed. Refresh the workspace and try again.'}</p>
    <button className="primary-button" type="button" onClick={() => reset()}>Try again</button>
  </section>
}
