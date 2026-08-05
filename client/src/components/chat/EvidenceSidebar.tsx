import { useMemo, useState } from 'react';
import { Button, Select } from '@/components/ui';
import { EVIDENCE_PROMPTS, type EvidencePrompt } from '@/utils/helpers/evidencePrompts';
import { cn } from '@/utils/helpers/cn';

interface EvidencePickerProps {
  onSelectPrompt: (prompt: EvidencePrompt) => void;
  className?: string;
  compact?: boolean;
}

export function EvidencePicker({
  onSelectPrompt,
  className,
  compact = false,
}: EvidencePickerProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState('');

  const options = useMemo(
    () =>
      EVIDENCE_PROMPTS.map((prompt) => ({
        value: prompt.id,
        label: `${prompt.id} — ${prompt.label}`,
      })),
    [],
  );

  const handleRun = (): void => {
    const prompt = EVIDENCE_PROMPTS.find((item) => item.id === selectedId);
    if (!prompt) return;
    onSelectPrompt(prompt);
    setSelectedId('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      {!compact && (
        <p className="text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          Try this
        </p>
      )}
      <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
        Sends as your message on this property — does not switch listings.
      </p>
      <Select
        options={options}
        value={selectedId}
        onChange={setSelectedId}
        placeholder="Select evidence case…"
        className="!text-[var(--text-sm)]"
      />
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        disabled={selectedId.length === 0}
        onClick={handleRun}
      >
        Send prompt
      </Button>
    </div>
  );
}

interface EvidenceSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: EvidencePrompt) => void;
}

export function EvidenceSheet({
  open,
  onClose,
  onSelectPrompt,
}: EvidenceSheetProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close evidence sheet"
        className="absolute inset-0 bg-[var(--color-bg-overlay)]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-[var(--radius-sm)] border-t border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-4 shadow-[var(--shadow-modal)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold not-italic text-[var(--color-text-primary)]">
            Try this
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <EvidencePicker
          onSelectPrompt={(prompt) => {
            onSelectPrompt(prompt);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
