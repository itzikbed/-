import React from 'react'
import { Html, Head, Body, Container, Section, Text, Link, Preview, Heading } from '@react-email/components'
import { gendered, strings } from '../lib/strings'

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

          <Section style={buttonContainerStyle} dir="rtl">
            <table align="center" border={0} cellPadding={0} cellSpacing={0} style={buttonTableStyle} dir="rtl">
              <tr>
                <td align="center" style={buttonTdStyle}>
                  <Link href={catalogUrl} style={buttonLinkStyle}>
                    {gendered('emails', 'requestClosedCatAdoptedCta', catSex)}
                  </Link>
                </td>
              </tr>
            </table>
          </Section>
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
  backgroundColor: '#FFFFFF',
  border: '1px solid #E3E0D7',
  borderRadius: '16px',
  padding: '40px 30px',
  maxWidth: '560px',
  margin: '0 auto',
}

const logoSectionStyle = {
  borderBottom: '1px solid #E3E0D7',
  paddingBottom: '20px',
  marginBottom: '30px',
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

const buttonContainerStyle = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const buttonTableStyle = {
  margin: '0 auto',
}

const buttonTdStyle = {
  backgroundColor: '#EBAF56',
  borderRadius: '9999px',
  padding: '12px 30px',
}

const buttonLinkStyle = {
  color: '#1E2B25',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
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
