/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'

export const hebrewErrorMap = (issue: any, ctx: any) => {
  let message = ctx.defaultError

  if (issue.code === 'invalid_type') {
    if (
      ctx.defaultError?.includes('required') || 
      ctx.defaultError?.includes('undefined') || 
      ctx.defaultError?.includes('received undefined') ||
      issue.message?.includes('received undefined')
    ) {
      message = 'שדה חובה'
    } else {
      message = 'ערך לא תקין'
    }
  } else if (issue.code === 'too_small') {
    const origin = issue.origin || issue.type
    if (origin === 'string') {
      if (issue.minimum === 1) {
        message = 'שדה חובה'
      } else {
        message = `נדרשים לפחות ${issue.minimum} תווים`
      }
    } else if (origin === 'number') {
      message = `הערך חייב להיות לפחות ${issue.minimum}`
    }
  } else if (issue.code === 'too_big') {
    const origin = issue.origin || issue.type
    if (origin === 'string') {
      message = `מותרים לכל היותר ${issue.maximum} תווים`
    } else if (origin === 'number') {
      message = `הערך חייב להיות לכל היותר ${issue.maximum}`
    }
  } else if (issue.code === 'invalid_format') {
    if (issue.format === 'email') {
      message = 'כתובת אימייל לא תקינה'
    }
  }

  return { message }
}

// Helper to set map globally (call in layout/app startup)
export function initHebrewValidation() {
  z.setErrorMap(hebrewErrorMap as any)
}
