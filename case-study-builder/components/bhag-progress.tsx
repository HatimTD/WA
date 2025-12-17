import { waGetBhagProgress } from '@/lib/actions/waBhagActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp } from 'lucide-react';

export default async function BHAGProgress() {
  const result = await waGetBhagProgress();

  if (!result.success || !result.bhag) {
    return null;
  }

  const { uniqueCount, totalCount, target, percentage, byType } = result.bhag;

  return (
    <Card className="border-2 border-wa-green-200 bg-gradient-to-br from-wa-green-50 to-white dark:border-green-700 dark:bg-gradient-to-br dark:from-green-900 dark:to-green-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-green-50">
              <Target className="h-6 w-6 text-wa-green-600 dark:text-green-400" />
              BHAG Progress
            </CardTitle>
            <CardDescription className="dark:text-green-200">Big Hairy Audacious Goal: {target.toLocaleString()} Unique Case Studies</CardDescription>
          </div>
          <TrendingUp className="h-8 w-8 text-wa-green-500 dark:text-green-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-4xl font-bold text-wa-green-600 dark:text-green-300">{uniqueCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-green-100">
                unique cases • {totalCount.toLocaleString()} total submissions
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-700 dark:text-green-50">{percentage}%</p>
              <p className="text-xs text-gray-500 dark:text-green-300/70">of target</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3 bg-green-800/30 dark:bg-green-950/50 [&>div]:bg-green-500 dark:[&>div]:bg-green-400" />
          <p className="text-xs text-gray-500 dark:text-green-300/70 mt-2">
            Target: {target.toLocaleString()} unique case studies
          </p>
        </div>

        {/* Breakdown by Type */}
        <div>
          <p className="text-sm font-medium mb-3 dark:text-green-50">Breakdown by Type (Unique)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-3 text-center dark:bg-green-950/50 dark:border-green-700">
              <Badge className="bg-wa-green-100 text-wa-green-700 mb-1 dark:bg-green-800 dark:text-green-200 dark:border-green-600 dark:border">APPLICATION</Badge>
              <p className="text-2xl font-bold text-wa-green-600 dark:text-green-300">{byType.APPLICATION}</p>
              <p className="text-xs text-gray-600 dark:text-green-200">unique cases</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center dark:bg-purple-950/50 dark:border-purple-700">
              <Badge className="bg-purple-100 text-purple-700 mb-1 dark:bg-purple-800 dark:text-purple-200 dark:border-purple-600 dark:border">TECH</Badge>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{byType.TECH}</p>
              <p className="text-xs text-gray-600 dark:text-purple-200">unique cases</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center dark:bg-yellow-950/50 dark:border-yellow-700">
              <Badge className="bg-yellow-100 text-yellow-700 mb-1 dark:bg-yellow-800 dark:text-yellow-200 dark:border-yellow-600 dark:border">STAR</Badge>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{byType.STAR}</p>
              <p className="text-xs text-gray-600 dark:text-yellow-200">unique cases</p>
            </div>
          </div>
        </div>

        {/* Deduplication Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-green-950/30 dark:border-green-800">
          <p className="text-xs text-gray-600 dark:text-green-200">
            <strong className="dark:text-green-100">Deduplication:</strong> Case studies are counted as unique based on the
            combination of Industry + Location + Component. This ensures we're measuring true
            diversity in our case study database.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
