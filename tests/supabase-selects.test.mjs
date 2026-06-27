import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

test('Supabase relationship selects are explicit after V2 reliability migration', { skip: !url || !key }, async () => {
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const checks = [
    supabase.from('deals').select('id,deal_title,companies!deals_company_id_fkey(company_name)').limit(1),
    supabase.from('companies').select('id,company_name,deals!deals_company_id_fkey(id,deal_title)').limit(1),
    supabase.from('finance_records').select('id,deals(id,deal_title,companies!deals_company_id_fkey(company_name))').limit(1),
    supabase.from('tasks').select('id,deals(deal_title,companies!deals_company_id_fkey(company_name))').limit(1),
    supabase.from('outreach_logs').select('id,deals(deal_title,companies!deals_company_id_fkey(company_name))').limit(1),
  ]

  for (const check of checks) {
    const { error } = await check
    assert.equal(error, null)
  }
})
