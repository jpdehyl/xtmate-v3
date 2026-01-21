import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-24", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 border border-gray-200 dark:border-gray-800 rounded-lg", className)}>
      <Skeleton className="h-5 w-3/4 mb-3" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function EstimatesTableSkeleton() {
  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-6 py-3 text-left hidden sm:table-cell">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-3 text-left hidden md:table-cell">
              <Skeleton className="h-4 w-16" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i}>
              <td className="px-6 py-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-6 py-4 hidden sm:table-cell">
                <Skeleton className="h-4 w-48" />
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EstimateDetailSkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <Skeleton className="h-10 w-10 mx-auto mb-3 rounded-full" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </section>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
