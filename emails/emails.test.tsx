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
import CatArchivedByAdmin, { getSubject as getCatArchivedByAdminSubject } from './CatArchivedByAdmin'
import RequestClosedCatAdopted, { getSubject as getRequestClosedCatAdoptedSubject } from './RequestClosedCatAdopted'
import SupportChatDigest, { getSubject as getSupportChatDigestSubject } from './SupportChatDigest'

describe('Email Templates Validation', () => {
  const catName = 'Mitzi'
  const reason = 'Missing medical details description'
  const adminNote = 'Adoption request rejected due to age check'

  it('checks SupportChatDigest template rules', async () => {
    const subject = getSupportChatDigestSubject(12)
    expect(subject.length).toBeLessThanOrEqual(45)
    expect(subject).toContain('12')

    const element = <SupportChatDigest waitingCount={12} />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain('12')
    expect(text.length).toBeGreaterThan(0)
  })

  it('checks PublisherApproved template rules', async () => {
    const subject = getPublisherApprovedSubject()
    expect(subject.length).toBeLessThanOrEqual(45)

    const element = <PublisherApproved fullName="Israel" />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
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

    const element = <CatRejected catName={catName} catSex="female" reason={reason} />
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

    // Adopter Role Verification
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
    expect(html).toContain(`dir="ltr"`)
    expect(html).toContain(`>${counterpartPhone}</span>`)
    expect(html).toContain(counterpartName)
    expect(text).toContain(counterpartName)
    expect(text).toContain(counterpartPhone)

    // Publisher Role Verification
    const publisherElement = (
      <RequestApproved
        catName={catName}
        catSex="female"
        recipientRole="publisher"
        counterpartName={counterpartName}
        counterpartPhone={counterpartPhone}
      />
    )
    const pubHtml = await render(publisherElement)
    const pubText = await render(publisherElement, { plainText: true })

    expect(pubHtml).toContain('dir="rtl"')
    expect(pubHtml).toContain('dir="ltr"')
    expect(pubHtml).toContain(`dir="ltr"`)
    expect(pubHtml).toContain(`>${counterpartPhone}</span>`)
    expect(pubHtml).toContain(counterpartName)
    expect(pubText).toContain(counterpartName)
    expect(pubText).toContain(counterpartPhone)
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

  it('checks CatArchivedByAdmin template rules', async () => {
    // Assert subject is ≤ 45 characters for all gender variants of CatArchivedByAdmin
    const subjectMale = getCatArchivedByAdminSubject(catName, 'male')
    const subjectFemale = getCatArchivedByAdminSubject(catName, 'female')
    const subjectUnknown = getCatArchivedByAdminSubject(catName, 'unknown')
    expect(subjectMale.length).toBeLessThanOrEqual(45)
    expect(subjectFemale.length).toBeLessThanOrEqual(45)
    expect(subjectUnknown.length).toBeLessThanOrEqual(45)

    const element = <CatArchivedByAdmin catName={catName} catSex="male" reason="Unsuitable content" />
    const html = await render(element)
    const text = await render(element, { plainText: true })

    expect(html).toContain('dir="rtl"')
    expect(html).toContain('Unsuitable content')
    expect(text).toContain(catName)
    expect(text).toContain('Unsuitable content')
  })

  it('checks RequestClosedCatAdopted template rules (male and female)', async () => {
    // Assert subject is ≤ 45 characters for all gender variants of RequestClosedCatAdopted
    const subjectMale = getRequestClosedCatAdoptedSubject(catName, 'male')
    const subjectFemale = getRequestClosedCatAdoptedSubject(catName, 'female')
    const subjectUnknown = getRequestClosedCatAdoptedSubject(catName, 'unknown')
    expect(subjectMale.length).toBeLessThanOrEqual(45)
    expect(subjectFemale.length).toBeLessThanOrEqual(45)
    expect(subjectUnknown.length).toBeLessThanOrEqual(45)

    // Male Render Assertions
    const elementMale = <RequestClosedCatAdopted catName={catName} catSex="male" />
    const htmlMale = await render(elementMale)
    const textMale = await render(elementMale, { plainText: true })

    expect(htmlMale).toContain('dir="rtl"')
    expect(textMale).toContain(catName)
     expect(textMale).toContain(strings.emails.wordFoundMale)
     expect(textMale).not.toContain(strings.emails.wordFoundFemale)
 
     // Female Render Assertions
     const elementFemale = <RequestClosedCatAdopted catName={catName} catSex="female" />
     const htmlFemale = await render(elementFemale)
     const textFemale = await render(elementFemale, { plainText: true })
 
     expect(htmlFemale).toContain('dir="rtl"')
     expect(textFemale).toContain(catName)
     expect(textFemale).toContain(strings.emails.wordFoundFemale)

    // Verify the two renders differ
    expect(textMale).not.toEqual(textFemale)
  })
})
