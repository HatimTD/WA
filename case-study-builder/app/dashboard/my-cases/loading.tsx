import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function MyCasesLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-36 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b dark:border-border">
        {['All', 'Draft', 'Submitted', 'Approved', 'Rejected'].map((tab) => (
          <div key={tab} className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-t" />
        ))}
      </div>

      {/* Cases Table Skeleton */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table role="table" className="w-full">
              <thead>
                <tr className="border-b dark:border-border">
                  {['Title', 'Customer', 'Type', 'Status', 'Date', 'Actions'].map((header) => (
                    <th key={header} className="text-left p-4">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-b dark:border-border">
                    <td className="p-4">
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    </td>
                    <td className="p-4">
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}