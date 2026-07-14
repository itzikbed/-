import React from 'react'
import { Html, Head, Body, Container, Section, Text, Link, Preview, Heading } from '@react-email/components'
import { gendered, strings } from '../lib/strings'

export interface RequestApprovedProps {
  catName?: string
  catSex?: 'male' | 'female' | 'unknown'
  recipientRole?: 'adopter' | 'publisher'
  counterpartName?: string
  counterpartPhone?: string
}

export const getSubject = (
  catName?: string,
  catSex: 'male' | 'female' | 'unknown' = 'unknown',
  recipientRole: 'adopter' | 'publisher' = 'adopter'
) => {
  const name = catName || strings.common.defaultCatName
  const key = recipientRole === 'adopter' ? 'requestApprovedAdopterSubject' : 'requestApprovedPublisherSubject'
  return gendered('emails', key, catSex).replace('{name}', name)
}

export default function RequestApproved({
  catName = '',
  catSex = 'unknown',
  recipientRole = 'adopter',
  counterpartName = '',
  counterpartPhone = ''
}: RequestApprovedProps) {
  const requestsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/requests`
  const name = catName || strings.common.defaultCatName
  
  const keyPrefix = recipientRole === 'adopter' ? 'requestApprovedAdopter' : 'requestApprovedPublisher'
  const heading = gendered('emails', `${keyPrefix}Heading`, catSex).replace('{name}', name)
  const bodyText = gendered('emails', `${keyPrefix}Text`, catSex).replace('{name}', name)

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

          <Section style={detailsBoxStyle} dir="rtl">
            <Heading style={detailsHeadingStyle}>{gendered('emails', 'requestApprovedDetailsHeading', catSex)}</Heading>
            <table width="100%" border={0} cellPadding={5} cellSpacing={0} style={detailsTableStyle} dir="rtl">
              <tr>
                <td width="80" style={tableLabelStyle}>{gendered('emails', 'requestApprovedDetailsName', catSex)}</td>
                <td style={tableValueStyle}>{counterpartName}</td>
              </tr>
              <tr>
                <td style={tableLabelStyle}>{gendered('emails', 'requestApprovedDetailsPhone', catSex)}</td>
                <td style={tableValueStyle}>
                  <span dir="ltr" style={ltrSpanStyle}>{counterpartPhone}</span>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={buttonContainerStyle} dir="rtl">
            <table align="center" border={0} cellPadding={0} cellSpacing={0} style={buttonTableStyle} dir="rtl">
              <tr>
                <td align="center" style={buttonTdStyle}>
                  <Link href={requestsUrl} style={buttonLinkStyle}>
                    {gendered('emails', 'requestApprovedDetailsCta', catSex)}
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

const detailsBoxStyle = {
  backgroundColor: '#F7F5F0',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #E3E0D7',
  marginBottom: '25px',
}

const detailsHeadingStyle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#1C6650',
  margin: '0 0 15px 0',
  textAlign: 'right' as const,
}

const detailsTableStyle = {
  borderCollapse: 'collapse' as const,
}

const tableLabelStyle = {
  fontSize: '14px',
  color: '#55645C',
  fontWeight: '600',
  textAlign: 'right' as const,
  padding: '6px 0',
}

const tableValueStyle = {
  fontSize: '15px',
  color: '#1E2B25',
  fontWeight: '700',
  textAlign: 'right' as const,
  padding: '6px 0',
}

const ltrSpanStyle = {
  unicodeBidi: 'embed' as const,
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
