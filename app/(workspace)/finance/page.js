import { createFinanceGoal, createFinanceRecord, updateFinanceGoalProgress } from '@/app/actions'
import { requireAppContext } from '@/lib/auth'
import { money, shortDate } from '@/lib/format'
import { buildFinanceChecks, goalActualAmount, goalProgress } from '@/lib/reliability.mjs'

export const dynamic = 'force-dynamic'

const goalTypeLabels = {
  cash_flow: 'Cash flow',
  revenue: 'Revenue',
  collections: 'Collections',
  expense_control: 'Expense control',
  savings: 'Savings',
  pipeline: 'Pipeline',
}

const goalStatusLabels = {
  active: 'Active',
  paused: 'Paused',
  complete: 'Complete',
  archived: 'Archived',
}

function shortGoalDate(value) {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export default async function FinancePage() {
  const { supabase, workspace } = await requireAppContext()
  const todayDate = new Date().toISOString().slice(0, 10)
  const defaultGoalEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10)
  const [{ data: records = [] }, { data: deals = [] }, { data: goals = [], error: goalsError }] = await Promise.all([
    supabase.from('finance_records').select('id,deal_id,total_amount,paid_amount,remaining_amount,expense_amount,payment_status,due_date,invoice_number,created_at,deals(id,deal_title,stage,value,companies!deals_company_id_fkey(company_name))').eq('workspace_id', workspace.id).order('due_date'),
    supabase.from('deals').select('id,deal_title,stage,value,companies!deals_company_id_fkey(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
    supabase.from('finance_goals').select('id,title,goal_type,target_amount,current_amount,period_start,period_end,status,notes').eq('workspace_id', workspace.id).order('period_end'),
  ])

  const signed = records.reduce((total, item) => total + Number(item.total_amount || 0), 0)
  const collected = records.reduce((total, item) => total + Number(item.paid_amount || 0), 0)
  const pending = records.reduce((total, item) => total + Number(item.remaining_amount || 0), 0)
  const expenses = records.reduce((total, item) => total + Number(item.expense_amount || 0), 0)
  const financeGoals = Array.isArray(goals) ? goals : []
  const activeGoals = financeGoals.filter((goal) => goal.status !== 'archived')
  const financeChecks = buildFinanceChecks({ records, deals })

  return <>
    <header className="page-heading">
      <div>
        <h1>Finance</h1>
        <p>Every deal connected to what has been invoiced, paid, targeted, and still needs chasing.</p>
      </div>
    </header>

    <section className="panel">
      <div className="metric-stack">
        <div>
          <span>Total signed value</span>
          <strong>{money(signed)}</strong>
          <small>Across tracked invoices</small>
        </div>
        <div>
          <span>Money collected</span>
          <strong>{money(collected)}</strong>
          <small>Received payments</small>
        </div>
        <div>
          <span>Pending</span>
          <strong>{money(pending)}</strong>
          <small>Needs attention</small>
        </div>
        <div>
          <span>Active goals</span>
          <strong>{activeGoals.length}</strong>
          <small>Auto-tracked targets</small>
        </div>
      </div>
    </section>

    <section className="panel finance-section-gap">
      <div className="metric-stack">
        <div>
          <span>Cash flow</span>
          <strong>{money(collected - expenses)}</strong>
          <small>Collected minus expenses</small>
        </div>
        <div>
          <span>Expenses</span>
          <strong>{money(expenses)}</strong>
          <small>Tracked production cost</small>
        </div>
        <div>
          <span>Balance checks</span>
          <strong>{financeChecks.length}</strong>
          <small>{financeChecks.length ? 'Needs review' : 'Looks balanced'}</small>
        </div>
        <div>
          <span>Overdue</span>
          <strong>{financeChecks.filter((check) => check.type === 'overdue_balance').length}</strong>
          <small>Unpaid due balances</small>
        </div>
      </div>
    </section>

    <div className="dashboard-grid bottom finance-goal-layout">
      <section className="panel goals-panel">
        <div className="section-label">
          <h2>Finance goals</h2>
          <span className="text-action">{goalsError ? 'Migration needed' : `${activeGoals.length} active`}</span>
        </div>
        {goalsError ? <div className="settings-notice"><strong>Finance goals are waiting on the database migration.</strong><span>{goalsError.message}</span></div> : null}
        <div className="goal-grid">
          {activeGoals.length ? activeGoals.map((goal) => {
            const actual = goalActualAmount(goal, { records, deals })
            const progress = goalProgress(goal, { records, deals })
            return <article className="goal-card" key={goal.id}>
              <div className="goal-card-head">
                <span>{goalTypeLabels[goal.goal_type] || goal.goal_type}</span>
                <em>{goalStatusLabels[goal.status] || goal.status}</em>
              </div>
              <h3>{goal.title}</h3>
              <div className="goal-money">
                <strong>{money(actual)}</strong>
                <span>of {money(goal.target_amount)}</span>
              </div>
              <div className="progress goal-progress"><i style={{ width: `${progress}%` }}/></div>
              <div className="progress-caption">
                <strong>{progress}% complete</strong>
                <span>{shortGoalDate(goal.period_start)} - {shortGoalDate(goal.period_end)}</span>
              </div>
              {goal.notes ? <p>{goal.notes}</p> : null}
              <form className="goal-update-form" action={updateFinanceGoalProgress}>
                <input type="hidden" name="workspace_id" value={workspace.id}/>
                <input type="hidden" name="goal_id" value={goal.id}/>
                <input type="hidden" name="current_amount" value={actual}/>
                <label>Status<select name="status" defaultValue={goal.status}>{Object.entries(goalStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <button className="filter-button" type="submit">Update</button>
              </form>
            </article>
          }) : <div className="empty-board compact-empty">No finance goals yet. Set a target for cash flow, collections, savings, or pipeline value.</div>}
        </div>
      </section>

      <section className="panel new-panel">
        <h2>Set a finance goal</h2>
        <p>Use goals to keep cash flow, collections, savings, and pipeline targets visible every day.</p>
        <form action={createFinanceGoal}>
          <input type="hidden" name="workspace_id" value={workspace.id}/>
          <label>Goal name<input required name="title" placeholder="e.g. Collect 400k this month"/></label>
          <div className="form-row">
            <label>Goal type<select name="goal_type" defaultValue="cash_flow">{Object.entries(goalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Target amount (ETB)<input required name="target_amount" type="number" min="1" step="0.01" placeholder="0"/></label>
          </div>
          <div className="form-row"><label>Start date<input required name="period_start" type="date" defaultValue={todayDate}/></label><label>End date<input required name="period_end" type="date" defaultValue={defaultGoalEnd}/></label></div>
          <label>Notes<textarea name="notes" placeholder="Target reason, owner, cash flow focus, or what needs to happen."/></label>
          <button className="primary-button" type="submit">Create goal</button>
        </form>
      </section>
    </div>

    <section className="panel new-panel finance-section-gap">
      <h2>Track a payment</h2>
      <p>Attach an invoice or payment schedule to a signed deal. Remaining balance is calculated by the database.</p>
      <form action={createFinanceRecord}>
        <input type="hidden" name="workspace_id" value={workspace.id}/>
        <div className="form-row">
          <label>Deal<select required name="deal_id" defaultValue=""><option value="" disabled>Select a deal</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.companies?.company_name || deal.deal_title} - {deal.deal_title}</option>)}</select></label>
          <label>Invoice number<input name="invoice_number" placeholder="INV-001"/></label>
        </div>
        <div className="form-row">
          <label>Total amount (ETB)<input required name="total_amount" type="number" min="0" step="0.01" placeholder="0"/></label>
          <label>Paid so far (ETB)<input required name="paid_amount" type="number" min="0" step="0.01" defaultValue="0"/></label>
        </div>
        <label>Expense amount (ETB)<input name="expense_amount" type="number" min="0" step="0.01" defaultValue="0"/></label>
        <div className="form-row">
          <label>Due date<input name="due_date" type="date"/></label>
          <label>Status<select name="payment_status" defaultValue="pending"><option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>
        </div>
        <button className="primary-button" type="submit">Add payment record</button>
      </form>
    </section>

    <section className="panel finance-section-gap">
      <div className="section-label">
        <h2>Balance checks</h2>
        <span className="text-action">{financeChecks.length ? `${financeChecks.length} warnings` : 'Balanced'}</span>
      </div>
      <div className="money-list">
        {financeChecks.length ? financeChecks.map((check, index) => <div className={`money-row check-${check.severity}`} key={`${check.type}-${check.deal_id}-${index}`}>
          <span><strong>{check.message}</strong><small>{check.type.replace('_', ' ')}</small></span>
          <b>{check.severity}</b>
          <em>Review</em>
        </div>) : <div className="empty-board compact-empty">Finance records and pipeline stages are currently in balance.</div>}
      </div>
    </section>

    <section className="panel finance-section-gap">
      <div className="section-label">
        <h2>Payment tracker</h2>
        <span className="text-action">Live from deal finance</span>
      </div>
      <div className="money-list">
        {records.length ? records.map((record) => <div className="money-row" key={record.id}>
          <span>
            <strong>{record.deals?.companies?.company_name || record.deals?.deal_title || 'Untitled deal'}</strong>
            <small>{record.invoice_number || 'No invoice number'} - due {shortDate(record.due_date)}</small>
          </span>
          <b>{money(record.remaining_amount)}</b>
          <em>{record.payment_status.replace('_', ' ')}</em>
        </div>) : <div className="empty-board">No finance records yet. Connect payment terms to a deal as soon as it is signed.</div>}
      </div>
    </section>
  </>
}
