import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDuplicateWarnings,
  buildFinanceChecks,
  goalActualAmount,
  goalProgress,
  normalizeCompanyName,
} from '../lib/reliability.mjs'

test('normalizes company names for duplicate checks', () => {
  assert.equal(normalizeCompanyName('The Lofty Studios, LLC'), 'lofty')
  assert.equal(normalizeCompanyName('Lofty & Co.'), 'lofty and')
})

test('warns and prefers existing company for similar leads', () => {
  const result = buildDuplicateWarnings({
    input: { companyName: 'Hey Mobile Ethiopia', dealTitle: 'Brand campaign' },
    companies: [{ id: 'company-1', company_name: 'Hey Mobile', website: 'https://heymobile.com' }],
    contacts: [],
    deals: [],
  })

  assert.equal(result.preferredCompanyId, 'company-1')
  assert.equal(result.hasWarnings, true)
  assert.equal(result.warnings[0].type, 'similar_company')
})

test('reuses matching contacts by email and warns on open deals', () => {
  const result = buildDuplicateWarnings({
    input: { companyName: 'Acme', email: ' buyer@acme.com ', dealTitle: 'Launch' },
    companies: [{ id: 'company-1', company_name: 'Acme' }],
    contacts: [{ id: 'contact-1', company_id: 'company-1', name: 'Buyer', email: 'buyer@acme.com' }],
    deals: [{ id: 'deal-1', company_id: 'company-1', deal_title: 'Launch', stage: 'open_deals' }],
  })

  assert.equal(result.preferredCompanyId, 'company-1')
  assert.equal(result.preferredContactId, 'contact-1')
  assert.equal(result.warnings.some((warning) => warning.type === 'matching_contact'), true)
  assert.equal(result.warnings.some((warning) => warning.type === 'open_deal'), true)
})

test('calculates finance goals from records and pipeline', () => {
  const records = [
    { total_amount: 1000, paid_amount: 600, expense_amount: 100, due_date: '2026-06-10' },
    { total_amount: 500, paid_amount: 250, expense_amount: 25, due_date: '2026-06-20' },
  ]
  const deals = [
    { value: 2000, stage: 'open_deals' },
    { value: 900, stage: 'closed_won' },
  ]

  assert.equal(goalActualAmount({ goal_type: 'revenue', period_start: '2026-06-01', period_end: '2026-06-30' }, { records, deals }), 1500)
  assert.equal(goalActualAmount({ goal_type: 'collections', period_start: '2026-06-01', period_end: '2026-06-30' }, { records, deals }), 850)
  assert.equal(goalActualAmount({ goal_type: 'cash_flow', period_start: '2026-06-01', period_end: '2026-06-30' }, { records, deals }), 725)
  assert.equal(goalActualAmount({ goal_type: 'pipeline', period_start: '2026-06-01', period_end: '2026-06-30' }, { records, deals }), 2000)
  assert.equal(goalProgress({ goal_type: 'collections', target_amount: 1000, period_start: '2026-06-01', period_end: '2026-06-30' }, { records, deals }), 85)
})

test('flags finance consistency problems', () => {
  const checks = buildFinanceChecks({
    now: new Date('2026-06-27T12:00:00Z'),
    deals: [
      { id: 'deal-1', deal_title: 'Mismatch', value: 1000, stage: 'open_deals' },
      { id: 'deal-2', deal_title: 'Paid deal', value: 500, stage: 'waiting_payment' },
      { id: 'deal-3', deal_title: 'Closed no invoice', value: 700, stage: 'closed_won' },
    ],
    records: [
      { deal_id: 'deal-1', total_amount: 800, paid_amount: 200, remaining_amount: 600, invoice_number: 'INV-1', due_date: '2026-06-01' },
      { deal_id: 'deal-2', total_amount: 500, paid_amount: 500, remaining_amount: 0, invoice_number: 'INV-2', due_date: '2026-06-10' },
    ],
  })

  assert.equal(checks.some((check) => check.type === 'value_mismatch'), true)
  assert.equal(checks.some((check) => check.type === 'overdue_balance'), true)
  assert.equal(checks.some((check) => check.type === 'paid_waiting'), true)
  assert.equal(checks.some((check) => check.type === 'missing_finance'), true)
})
