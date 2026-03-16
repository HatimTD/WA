import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Activity Feed and Stats Grid Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Feed Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 mt-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Stats Column */}
        <div className="space-y-4">
          {/* Points Card */}
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardContent>
          </Card>

          {/* Cases Card */}
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-10 w-16 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* BHAG Progress Card */}
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Cases Skeleton */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border dark:border-border rounded-lg p-4 space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}