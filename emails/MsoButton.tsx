import React from 'react'

interface MsoButtonProps {
  href: string
  text: string
}

export function MsoButton({ href, text }: MsoButtonProps) {
  // Using the Outlook MSO/VML hybrid button pattern
  const html = `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="100%" stroke="f" fillcolor="#EBAF56">
      <w:anchorlock/>
      <center style="color:#1E2B25;font-family:sans-serif;font-size:16px;font-weight:600;line-height:48px;">${text}</center>
    </v:roundrect>
    <div style="display:none; overflow:hidden; float:left; width:0px; max-height:0px; max-width:0px; line-height:0px; visibility:hidden;">
    <![endif]-->
    <a href="${href}" style="background-color:#EBAF56;border-radius:9999px;color:#1E2B25;display:inline-block;font-family:sans-serif;font-size:16px;font-weight:600;line-height:48px;text-align:center;text-decoration:none;width:220px;-webkit-text-size-adjust:none;mso-hide:all;">${text}</a>
    <!--[if mso]>
    </div>
    <![endif]-->
  `
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ textAlign: 'center', margin: '30px 0' }} />
}
