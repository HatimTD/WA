import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LibraryLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />

      {/* Case Studies Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card role="article" key={i} className="dark:bg-card dark:border-border overflow-hidden">
            {/* Image Skeleton */}
            <div className="h-48 bg-gray-200 dark:bg-gray-800" />

            <CardHeader className="space-y-2">
              {/* Title */}
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
              {/* Customer */}
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Description */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-4/6 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>

              {/* Meta Info */}
              <div className="flex justify-between pt-2 border-t dark:border-border">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded" />
        ))}
      </div>
    </div>
  );
}