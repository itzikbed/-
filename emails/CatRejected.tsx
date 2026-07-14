import React from 'react'
import { Html, Head, Body, Container, Section, Text, Link, Preview, Heading } from '@react-email/components'
import { gendered, strings } from '../lib/strings'

export interface CatRejectedProps {
  catName?: string
  catSex?: 'male' | 'female' | 'unknown'
  catId?: string
  reason?: string
}

export const getSubject = (catName?: string, catSex: 'male' | 'female' | 'unknown' = 'unknown') => {
  const name = catName || strings.common.defaultCatName
  return gendered('emails', 'catRejectedSubject', catSex).replace('{name}', name)
}

export default function CatRejected({ catName = '', catSex = 'unknown', reason = '' }: CatRejectedProps) {
  const editUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/publish`
  const name = catName || strings.common.defaultCatName
  
  const heading = gendered('emails', 'catRejectedHeading', catSex).replace('{name}', name)
  const bodyText = gendered('emails', 'catRejectedText', catSex).replace('{name}', name)

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
          
          {reason && (
            <Section style={reasonBoxStyle} dir="rtl">
              <Text style={reasonLabelStyle}>{gendered('emails', 'catRejectedReasonLabel', catSex)}</Text>
              <Text style={reasonTextStyle}>{reason}</Text>
            </Section>
          )}

          <Section style={buttonContainerStyle} dir="rtl">
            <table align="center" border={0} cellPadding={0} cellSpacing={0} style={buttonTableStyle} dir="rtl">
              <tr>
                <td align="center" style={buttonTdStyle}>
                  <Link href={editUrl} style={buttonLinkStyle}>
                    {gendered('emails', 'catRejectedCta', catSex)}
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

const reasonBoxStyle = {
  backgroundColor: '#F7F5F0',
  borderRight: '4px solid #D97706',
  padding: '15px 20px',
  borderRadius: '8px',
  marginBottom: '25px',
}

const reasonLabelStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#D97706',
  margin: '0 0 5px 0',
}

const reasonTextStyle = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#1E2B25',
  margin: '0',
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
}

const buttonLinkStyle = {
  color: '#1E2B25',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 30px',
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
