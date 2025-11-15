import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AnalyticsLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="h-4 w-80 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Summary Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card role="article" key={i} className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-1" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded opacity-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card role="article" key={i} className="dark:bg-card dark:border-border">
            <CardHeader>
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="h-64 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded">
                <div className="flex items-end justify-around h-full p-4">
                  {[60, 80, 45, 90, 70, 85, 55].map((height, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-300 dark:bg-gray-700 rounded-t"
                      style={{
                        width: '10%',
                        height: `${height}%`,
                        opacity: 0.5
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}