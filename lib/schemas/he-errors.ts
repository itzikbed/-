import { z } from 'zod'

type CustomErrorIssue = Parameters<NonNullable<NonNullable<Parameters<typeof z.config>[0]>['customError']>>[0]

export const hebrewErrorMap = (issue: CustomErrorIssue): { message: string } | undefined => {
  let message: string | undefined

  switch (issue.code) {
    case 'invalid_type':
      if (issue.input === undefined || issue.input === null) {
        message = 'שדה חובה'
      } else {
        message = 'ערך לא תקין'
      }
      break

    case 'too_small':
      if (issue.origin === 'string') {
        if (issue.minimum === 1) {
          message = 'שדה חובה'
        } else {
          message = `נדרשים לפחות ${issue.minimum} תווים`
        }
      } else if (issue.origin === 'number') {
        message = `הערך חייב להיות לפחות ${issue.minimum}`
      }
      break

    case 'too_big':
      if (issue.origin === 'string') {
        message = `מותרים לכל היותר ${issue.maximum} תווים`
      } else if (issue.origin === 'number') {
        message = `הערך חייב להיות לכל היותר ${issue.maximum}`
      }
      break

    case 'invalid_format':
      if (issue.format === 'email') {
        message = 'כתובת אימייל לא תקינה'
      }
      break

    default:
      break
  }

  return message ? { message } : undefined
}

export function initHebrewValidation() {
  z.config({
    customError: hebrewErrorMap
  })
}
