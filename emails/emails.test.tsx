import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@react-email/components'
import { strings } from '@/lib/strings'

// Import templates
import PublisherApproved, { getSubject as getPublisherApprovedSubject } from './PublisherApproved'
import CatApproved, { getSubject as getCatApprovedSubject } from './CatApproved'
import CatRejected, { getSubject as getCatRejectedSubject } from './CatRejected'
import RequestReceived, { getSubject as getRequestReceivedSubject } from './RequestReceived'
import RequestApproved, { getSubject as getRequestApprovedSubject } from './RequestApproved'
import RequestRejected, { getSubject as getRequestRejectedSubject } from './RequestRejected'

describe('Email Templates Validation', () => {
  const catName = 'Mitzi'
  const reason = 'Missing medical details description'
  const adminNote = 'Adoption request rejected due to age check'

  it('checks PublisherApproved template rules', async () => {
    const subject = getPublisherApprovedSubject()
    expect(subject.length).toBeLessThanOrEqual(45)

    const element = <PublisherApproved fullName="Israel" />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain('<table')
    expect(text.length).toBeGreaterThan(0)
  })

  it('checks CatApproved template rules', async () => {
    // Test male
    const subjectM = getCatApprovedSubject(catName, 'male')
    expect(subjectM.length).toBeLessThanOrEqual(45)
    
    // Test female
    const subjectF = getCatApprovedSubject(catName, 'female')
    expect(subjectF.length).toBeLessThanOrEqual(45)

    const element = <CatApproved catName={catName} catSex="female" catId="123" />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain(strings.common.logoLabel.substring(2)) // Assert site name exists in rendered HTML without hardcoded Hebrew
    expect(text.length).toBeGreaterThan(0)
  })

  it('checks CatRejected template rules', async () => {
    const subject = getCatRejectedSubject(catName, 'female')
    expect(subject.length).toBeLessThanOrEqual(45)

    const element = <CatRejected catName={catName} catSex="female" catId="123" reason={reason} />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain(reason)
    expect(text.length).toBeGreaterThan(0)
  })

  it('checks RequestReceived template rules', async () => {
    const subject = getRequestReceivedSubject(catName, 'female')
    expect(subject.length).toBeLessThanOrEqual(45)

    const element = <RequestReceived catName={catName} catSex="female" />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(text.length).toBeGreaterThan(0)
  })

  it('checks RequestApproved template rules (adopter and publisher)', async () => {
    const adopterSubject = getRequestApprovedSubject(catName, 'female', 'adopter')
    expect(adopterSubject.length).toBeLessThanOrEqual(45)

    const publisherSubject = getRequestApprovedSubject(catName, 'female', 'publisher')
    expect(publisherSubject.length).toBeLessThanOrEqual(45)

    const counterpartName = 'Moshe Cohen'
    const counterpartPhone = '052-1234567'

    const element = (
      <RequestApproved
        catName={catName}
        catSex="female"
        recipientRole="adopter"
        counterpartName={counterpartName}
        counterpartPhone={counterpartPhone}
      />
    )
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain('dir="ltr"') // Phone span direction
    expect(html).toContain(counterpartName)
    expect(html).toContain(counterpartPhone)
    expect(text.length).toBeGreaterThan(0)
  })

  it('checks RequestRejected template rules', async () => {
    const subject = getRequestRejectedSubject(catName, 'female')
    expect(subject.length).toBeLessThanOrEqual(45)

    const element = <RequestRejected catName={catName} catSex="female" adminNote={adminNote} />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain(adminNote)
    expect(text.length).toBeGreaterThan(0)
  })
})
