'use client'

import { strings } from '@/lib/strings'
import { Button } from '@/components/ui/Button'

interface UnpublishConsentCardProps {
  onConfirm: () => void
  onCancel: () => void
}

// Shown before the first save of a published listing: saving flips it to
// pending (moderation rule, ARCHITECTURE §11), so the drop from the catalog
// must be consented to, not discovered.
export function UnpublishConsentCard({ onConfirm, onCancel }: UnpublishConsentCardProps) {
  return (
    <div className="bg-marmalade-sf/40 border border-marmalade/30 rounded-input p-4 space-y-3">
      <p className="text-sm font-semibold text-ink">{strings.publish.editUnpublishNotice}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onConfirm}>
          {strings.publish.editUnpublishConfirmBtn}
        </Button>
        <Button type="button" variant="draft" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
      </div>
    </div>
  )
}
