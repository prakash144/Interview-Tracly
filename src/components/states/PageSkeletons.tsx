"use client";

const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-secondary/70 ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 lg:px-8">
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 sm:p-6">
        <div className="flex gap-5">
          <SkeletonBlock className="size-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-8 w-64" />
            <SkeletonBlock className="h-4 w-96" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SkeletonBlock className="h-20 rounded-lg" />
          <SkeletonBlock className="h-20 rounded-lg" />
          <SkeletonBlock className="h-20 rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-border/70 bg-card/80 p-5">
        <SkeletonBlock className="mb-4 h-4 w-24" />
        <SkeletonBlock className="size-[140px] mx-auto rounded-full" />
        <div className="mt-4 space-y-2">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-full" />
        </div>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-24 rounded-xl" />
      ))}
    </div>

    <SkeletonBlock className="h-48 w-full rounded-xl" />

    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonBlock className="h-40 rounded-xl" />
      <SkeletonBlock className="h-40 rounded-xl" />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonBlock className="h-40 rounded-xl" />
      <SkeletonBlock className="h-40 rounded-xl" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl border border-border/70 bg-card/80">
    <div className="border-b border-border/70 p-4">
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 flex-1" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-border/50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <SkeletonBlock key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SprintsSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-8 p-4 sm:px-6 lg:px-8">
    <div>
      <SkeletonBlock className="mb-3 h-4 w-24" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card/80 p-5">
            <SkeletonBlock className="mb-3 h-5 w-40" />
            <SkeletonBlock className="mb-4 h-3 w-full" />
            <div className="flex gap-4">
              <SkeletonBlock className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            </div>
            <SkeletonBlock className="mt-4 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const TracksSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 lg:px-8">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    <SkeletonBlock className="h-48 rounded-xl" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  </div>
);

export const SettingsSkeleton = () => (
  <div className="mx-auto max-w-3xl space-y-8 p-4 sm:px-6 lg:px-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border/70 bg-card/80 p-5">
        <SkeletonBlock className="mb-4 h-6 w-32" />
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-10 w-48 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export const ActivitySkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 lg:px-8">
    <div className="grid gap-4 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <SkeletonBlock className="h-80 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export const ReadinessSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 lg:px-8">
    <SkeletonBlock className="h-48 w-full rounded-xl" />
    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonBlock className="h-64 rounded-xl" />
      <SkeletonBlock className="h-64 rounded-xl" />
    </div>
    <SkeletonBlock className="h-48 w-full rounded-xl" />
  </div>
);

export const CollectionsSkeleton = () => (
  <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
    <div className="flex gap-6">
      <div className="hidden sm:block w-64 shrink-0">
        <div className="rounded-xl border border-border/70 bg-card/80 p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <TableSkeleton rows={5} />
      </div>
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 lg:px-8">
    <div className="grid gap-4 lg:grid-cols-3">
      <SkeletonBlock className="h-52 rounded-xl" />
      <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
    <SkeletonBlock className="h-16 w-full rounded-xl" />
    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonBlock className="h-64 rounded-xl" />
      <SkeletonBlock className="h-64 rounded-xl" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonBlock className="h-64 rounded-xl" />
      <SkeletonBlock className="h-64 rounded-xl" />
    </div>
  </div>
);
