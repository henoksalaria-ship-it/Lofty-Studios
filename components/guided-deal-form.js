'use client'

import { useMemo, useState } from 'react'
import Icon from '@/src/components/Icon'
import { createLead } from '@/app/actions'
import { buildDuplicateWarnings } from '@/lib/reliability.mjs'

const steps = ['Company', 'Contact', 'Deal', 'Follow-up', 'Review']

export default function GuidedDealForm({ workspaceId, companies = [], contacts = [], deals = [] }) {
  const [step, setStep] = useState(0)
  const [overrideDuplicate, setOverrideDuplicate] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    website: '',
    contactName: '',
    email: '',
    phone: '',
    source: 'website',
    dealTitle: '',
    service: '',
    value: '',
    probability: '25',
    temperature: 'warm',
    stage: 'cold_leads',
    nextFollowUpAt: '',
    notes: '',
  })

  const duplicateResult = useMemo(() => buildDuplicateWarnings({ input: form, companies, contacts, deals }), [form, companies, contacts, deals])
  const companyMatch = companies.find((company) => company.id === duplicateResult.preferredCompanyId)
  const contactMatch = contacts.find((contact) => contact.id === duplicateResult.preferredContactId)

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function Field({ label, name, children, ...props }) {
    return <label>{label}{children || <input name={name} value={form[name]} onChange={(event) => update(name, event.target.value)} {...props}/>}</label>
  }

  return <section className="panel guided-flow"><form action={createLead}><input type="hidden" name="workspace_id" value={workspaceId}/><input type="hidden" name="company_name" value={form.companyName}/><input type="hidden" name="contact_name" value={form.contactName}/><input type="hidden" name="deal_title" value={form.dealTitle}/><input type="hidden" name="next_follow_up_at" value={form.nextFollowUpAt}/><input type="hidden" name="company_id" value={!overrideDuplicate ? duplicateResult.preferredCompanyId || '' : ''}/><input type="hidden" name="contact_id" value={!overrideDuplicate ? duplicateResult.preferredContactId || '' : ''}/><input type="hidden" name="duplicate_override" value={overrideDuplicate ? 'true' : 'false'}/><div className="guided-steps">{steps.map((label, index) => <button key={label} type="button" className={index === step ? 'is-active' : index < step ? 'is-done' : ''} onClick={() => setStep(index)}><span>{index + 1}</span>{label}</button>)}</div><div className="guided-body">{step === 0 ? <div className="guided-grid"><Field required label="Company name" name="companyName" placeholder="e.g. Hey Mobile"/><Field label="Industry" name="industry" placeholder="Telecom, food, retail"/><Field label="Website" name="website" type="url" placeholder="https://company.com"/><Field label="Source" name="source"><select name="source" value={form.source} onChange={(event) => update('source', event.target.value)}><option value="website">Website</option><option value="referral">Referral</option><option value="dm">Instagram / TikTok DM</option><option value="cold_outreach">Cold outreach</option><option value="existing_client">Existing client</option></select></Field></div> : null}{step === 1 ? <div className="guided-grid"><Field label="Contact person" name="contactName" placeholder="Full name"/><Field label="Email" name="email" type="email" placeholder="name@company.com"/><Field label="Phone" name="phone" placeholder="+251..."/></div> : null}{step === 2 ? <div className="guided-grid"><Field label="Deal title" name="dealTitle" placeholder="e.g. Q3 social campaign"/><Field label="Service requested" name="service" placeholder="Production, campaign, content"/><Field label="Estimated value (ETB)" name="value" type="number" min="0" placeholder="0"/><Field label="Close probability" name="probability" type="number" min="0" max="100" placeholder="25"/><Field label="Temperature" name="temperature"><select name="temperature" value={form.temperature} onChange={(event) => update('temperature', event.target.value)}><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></select></Field><Field label="Starting stage" name="stage"><select name="stage" value={form.stage} onChange={(event) => update('stage', event.target.value)}><option value="cold_leads">Cold lead</option><option value="reached_out">Reached out</option><option value="open_deals">Open deal</option><option value="ongoing_deals">Ongoing deal</option></select></Field></div> : null}{step === 3 ? <div className="guided-grid"><Field label="Next follow-up" name="nextFollowUpAt" type="datetime-local"/><label className="guided-wide">Brief / notes<textarea name="notes" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Campaign timeline, budget context, preferred contact method, or anything useful for the next call."/></label></div> : null}{step === 4 ? <div className="review-panel"><div><span>Company</span><strong>{companyMatch && !overrideDuplicate ? companyMatch.company_name : form.companyName || 'New company'}</strong></div><div><span>Contact</span><strong>{contactMatch && !overrideDuplicate ? contactMatch.name : form.contactName || 'No contact yet'}</strong></div><div><span>Deal</span><strong>{form.dealTitle || `${form.companyName || 'Company'} campaign`}</strong></div><div><span>Follow-up</span><strong>{form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toLocaleString() : 'Today'}</strong></div></div> : null}{duplicateResult.hasWarnings ? <div className="duplicate-box"><div><strong>Likely match found</strong><span>The system will reuse the existing record unless you override it.</span></div>{duplicateResult.warnings.map((warning) => <p key={`${warning.type}-${warning.message}`}>{warning.message}</p>)}<label className="checkbox-line"><input type="checkbox" checked={overrideDuplicate} onChange={(event) => setOverrideDuplicate(event.target.checked)}/>Create a separate company/deal anyway</label></div> : null}</div><div className="guided-actions"><button className="filter-button" type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>{step < steps.length - 1 ? <button className="primary-button" type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Next <Icon name="arrow" size={15}/></button> : <button className="primary-button" type="submit"><Icon name="plus" size={16}/>Create lead and follow-up</button>}</div></form></section>
}
