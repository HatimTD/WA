import { getBHAGProgress } from '@/lib/actions/bhag-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp } from 'lucide-react';

export default async function BHAGProgress() {
  const result = await getBHAGProgress();

  if (!result.success || !result.bhag) {
    return null;
  }

  const { uniqueCount, totalCount, target, percentage, byType } = result.bhag;

  return (
    <Card className="border-2 border-wa-green-200 bg-gradient-to-br from-wa-green-50 to-white dark:border-primary dark:bg-primary dark:from-primary dark:to-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
              <Target className="h-6 w-6 text-wa-green-600 dark:text-white" />
              BHAG Progress
            </CardTitle>
            <CardDescription className="dark:text-white dark:opacity-80">Big Hairy Audacious Goal: {target.toLocaleString()} Unique Case Studies</CardDescription>
          </div>
          <TrendingUp className="h-8 w-8 text-wa-green-500 dark:text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-4xl font-bold text-wa-green-600 dark:text-white">{uniqueCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-80">
                unique cases • {totalCount.toLocaleString()} total submissions
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-700 dark:text-white">{percentage}%</p>
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70">of target</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-xs text-gray-500 dark:text-white dark:opacity-70 mt-2">
            Target: {target.toLocaleString()} unique case studies
          </p>
        </div>

        {/* Breakdown by Type */}
        <div>
          <p className="text-sm font-medium mb-3 dark:text-white">Breakdown by Type (Unique)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-3 text-center dark:bg-accent dark:border-accent">
              <Badge className="bg-wa-green-100 text-wa-green-700 mb-1 dark:bg-accent dark:text-white dark:border-white dark:border">APPLICATION</Badge>
              <p className="text-2xl font-bold text-wa-green-600 dark:text-white">{byType.APPLICATION}</p>
              <p className="text-xs text-gray-600 dark:text-white dark:opacity-80">unique cases</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center dark:bg-accent dark:border-accent">
              <Badge className="bg-purple-100 text-purple-700 mb-1 dark:bg-accent dark:text-white dark:border-white dark:border">TECH</Badge>
              <p className="text-2xl font-bold text-purple-600 dark:text-white">{byType.TECH}</p>
              <p className="text-xs text-gray-600 dark:text-white dark:opacity-80">unique cases</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center dark:bg-accent dark:border-accent">
              <Badge className="bg-yellow-100 text-yellow-700 mb-1 dark:bg-accent dark:text-white dark:border-white dark:border">STAR</Badge>
              <p className="text-2xl font-bold text-yellow-700 dark:text-white">{byType.STAR}</p>
              <p className="text-xs text-gray-600 dark:text-white dark:opacity-80">unique cases</p>
            </div>
          </div>
        </div>

        {/* Deduplication Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-background dark:border-border">
          <p className="text-xs text-gray-600 dark:text-muted-foreground">
            <strong className="dark:text-foreground">Deduplication:</strong> Case studies are counted as unique based on the
            combination of Industry + Location + Component. This ensures we're measuring true
            diversity in our case study database.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
