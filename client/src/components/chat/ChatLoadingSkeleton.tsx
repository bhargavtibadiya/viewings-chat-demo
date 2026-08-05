import { Skeleton } from '@/components/ui';

export function ChatLoadingSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading chat">
      <div className="flex justify-start">
        <Skeleton
          variant="custom"
          width="72%"
          height="3.25rem"
          className="rounded-[var(--radius-sm)]"
        />
      </div>
      <div className="flex justify-end">
        <Skeleton
          variant="custom"
          width="58%"
          height="2.75rem"
          className="rounded-[var(--radius-sm)]"
        />
      </div>
      <div className="flex justify-start">
        <Skeleton
          variant="custom"
          width="64%"
          height="4rem"
          className="rounded-[var(--radius-sm)]"
        />
      </div>
    </div>
  );
}
