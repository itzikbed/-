'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Radio } from '@/components/ui/radio'
import { Badge } from '@/components/ui/badge'
import { Chip } from '@/components/ui/chip'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Mascot } from '@/components/mascot/mascot'

export default function DevUiPlayground() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeChip, setActiveChip] = useState('center')
  const [inputText, setInputText] = useState('')
  const [inputError, setInputError] = useState('')

  const selectOptions = [
    { value: 'north', label: 'צפון' },
    { value: 'south', label: 'דרום' },
    { value: 'center', label: 'מרכז' },
    { value: 'jerusalem', label: 'ירושלים' },
    { value: 'yosh', label: 'איו"ש' }
  ]

  const toggleError = () => {
    setInputError(inputError ? '' : 'זהו שדה חובה עם שגיאת הדגמה')
  }

  return (
    <div className="app-container py-12 text-start">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-display font-extrabold text-ink mb-2">ארגז חול לרכיבי UI</h1>
        <p className="text-ink-soft">עמוד זמני לבדיקה ויזואלית של כל רכיבי העיצוב ומצבי הקמע של &quot;בית לחתול&quot;.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* ================= BUTTONS ================= */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-bold text-ink border-s-4 border-pine ps-3">כפתורים (Buttons)</h2>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">ראשי (Marmalade)</span>
              <Button variant="primary">רוצה לאמץ את מיצי</Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">משני (Pine)</span>
              <Button variant="secondary">למסירת חתול</Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">שלישי (Ghost)</span>
              <Button variant="tertiary">קרא עוד</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">בטעינה (Loading)</span>
              <Button variant="primary" loading>ראשי</Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">מנוטרל (Disabled)</span>
              <Button variant="secondary" disabled>משני מנוטרל</Button>
            </div>
          </div>
        </section>

        {/* ================= MASCOT POSES ================= */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-bold text-ink border-s-4 border-pine ps-3">קמע (Mascot Poses)</h2>
          <div className="bg-surface rounded-card p-6 border border-border flex flex-wrap gap-8 justify-around items-end">
            <div className="flex flex-col items-center gap-2">
              <Mascot pose="peek" />
              <span className="text-xs text-ink-soft font-semibold">מציץ (peek)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Mascot pose="sitting" />
              <span className="text-xs text-ink-soft font-semibold">יושב (sitting)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Mascot pose="sleeping" />
              <span className="text-xs text-ink-soft font-semibold">ישן (sleeping)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Mascot pose="celebrating" />
              <span className="text-xs text-ink-soft font-semibold">חוגג (celebrating)</span>
            </div>
          </div>
        </section>

        {/* ================= FORMS & INPUTS ================= */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-bold text-ink border-s-4 border-pine ps-3">טפסים ושדות קלט (Forms)</h2>
          
          <div className="space-y-4">
            <Input
              type="text"
              label="שם מלא (RTL)"
              placeholder="ישראל ישראלי"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              error={inputError}
              helperText="הקלד שם בעברית"
            />

            <Input
              type="email"
              label="כתובת אימייל (LTR אוטומטי)"
              placeholder="user@domain.com"
              required
            />

            <Select
              label="אזור בארץ"
              options={selectOptions}
              value={activeChip}
              onChange={(e) => setActiveChip(e.target.value)}
            />

            <div className="flex gap-6 items-center pt-2">
              <Checkbox label="אני מסכים לתנאי השימוש באתר" />
              <Radio label="בחירה אופציונלית" />
            </div>

            <Button variant="tertiary" onClick={toggleError} className="min-h-[36px] h-9 px-4 text-sm mt-2">
              סמלל שגיאת קלט
            </Button>
          </div>
        </section>

        {/* ================= BADGES & CHIPS ================= */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-bold text-ink border-s-4 border-pine ps-3">תגיות וכפתורי סינון (Badges & Chips)</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">מצבי תגיות (Badges)</span>
              <div className="flex flex-wrap gap-3">
                <Badge variant="published">פורסם</Badge>
                <Badge variant="adopted">אומץ! 🎉</Badge>
                <Badge variant="pending">ממתין לאישור</Badge>
                <Badge variant="rejected">נדחה</Badge>
                <Badge variant="draft">טיוטה</Badge>
                <Badge variant="archived">בארכיון</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">לחצני סינון (Chips)</span>
              <div className="flex flex-wrap gap-2">
                {selectOptions.map((region) => (
                  <Chip
                    key={region.value}
                    active={activeChip === region.value}
                    onClick={() => setActiveChip(region.value)}
                  >
                    {region.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= DIALOG & SKELETON ================= */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-bold text-ink border-s-4 border-pine ps-3">מודאלים וטעינה (Dialog & Skeleton)</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-soft font-semibold">שלד טעינה (Skeleton)</span>
              <div className="bg-surface rounded-card p-4 border border-border space-y-3">
                <div className="flex gap-3 items-center">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full rounded-photo" />
              </div>
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
                פתח דיאלוג מודאלי
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Dialog Modal Element */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="פרטי מאמץ פוטנציאלי"
        actions={
          <>
            <Button variant="tertiary" onClick={() => setIsDialogOpen(false)}>
              סגור
            </Button>
            <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
              אישור והמשך
            </Button>
          </>
        }
      >
        <p className="mb-2">זהו דיאלוג הדגמה מונפש ותואם נגישות.</p>
        <p>ניתן לסגור אותו על ידי לחיצה על כפתור ה-X, לחיצה מחוץ למודאל, או הקשה על מקש Esc במקלדת.</p>
      </Dialog>
    </div>
  )
}
