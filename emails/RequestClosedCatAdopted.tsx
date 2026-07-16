import React from 'react'
import { Html, Head, Body, Container, Section, Text, Preview, Heading } from '@react-email/components'
import { gendered, strings } from '../lib/strings'
import { MsoButton } from './MsoButton'

export interface RequestClosedCatAdoptedProps {
  catName?: string
  catSex?: 'male' | 'female' | 'unknown'
}

export const getSubject = (catName?: string, catSex: 'male' | 'female' | 'unknown' = 'unknown') => {
  const name = catName || strings.common.defaultCatName
  return gendered('emails', 'requestClosedCatAdoptedSubject', catSex).replace('{name}', name)
}

export default function RequestClosedCatAdopted({ catName = '', catSex = 'unknown' }: RequestClosedCatAdoptedProps) {
  const catalogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cats`
  const name = catName || strings.common.defaultCatName
  
  const heading = gendered('emails', 'requestClosedCatAdoptedHeading', catSex).replace('{name}', name)
  const bodyText = gendered('emails', 'requestClosedCatAdoptedText', catSex).replace('{name}', name)

  return (
    <Html lang="he" dir="rtl">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={mainStyle} dir="rtl">
        <Container style={containerStyle} dir="rtl">
          <Section style={logoSectionStyle} dir="rtl">
            <Text style={logoStyle}>{strings.common.logoLabel}</Text>
          </Section>
          <Heading style={headingStyle}>{heading}</Heading>
          <Text style={textStyle}>
            {bodyText}
          </Text>

          <MsoButton href={catalogUrl} text={gendered('emails', 'requestClosedCatAdoptedCta', catSex)} />

          <Section style={dividerStyle} dir="rtl" />
          <Text style={footerStyle}>
            {strings.common.emailFooter}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle = {
  backgroundColor: '#F7F5F0',
  fontFamily: "'Assistant', Arial, sans-serif",
  padding: '40px 20px',
}

const containerStyle = {
  backgroundColor: '#FDFCFA',
  border: '1px solid #E3E0D7',
  borderRadius: '20px',
  padding: '40px 30px',
  maxWidth: '600px',
  width: '100%',
  margin: '0 auto',
}

const logoSectionStyle = {
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const logoStyle = {
  fontSize: '24px',
  fontWeight: '800',
  color: '#1C6650',
  margin: '0',
}

const headingStyle = {
  color: '#1E2B25',
  fontSize: '22px',
  fontWeight: '700',
  marginBottom: '20px',
  textAlign: 'right' as const,
  margin: '0 0 20px 0',
}

const textStyle = {
  color: '#1E2B25',
  fontSize: '16px',
  lineHeight: '1.7',
  marginBottom: '20px',
  textAlign: 'right' as const,
  margin: '0 0 20px 0',
}

const dividerStyle = {
  borderTop: '1px solid #E3E0D7',
  margin: '30px 0',
}

const footerStyle = {
  color: '#55645C',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
}
