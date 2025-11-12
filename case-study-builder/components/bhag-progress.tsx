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
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-6 w-6 text-blue-600" />
              BHAG Progress
            </CardTitle>
            <CardDescription>Big Hairy Audacious Goal: 1,000 Unique Case Studies</CardDescription>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-4xl font-bold text-blue-600">{uniqueCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">
                unique cases • {totalCount.toLocaleString()} total submissions
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-700">{percentage}%</p>
              <p className="text-xs text-gray-500">of target</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-xs text-gray-500 mt-2">
            Target: {target.toLocaleString()} unique case studies
          </p>
        </div>

        {/* Breakdown by Type */}
        <div>
          <p className="text-sm font-medium mb-3">Breakdown by Type (Unique)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <Badge className="bg-blue-100 text-blue-700 mb-1">APPLICATION</Badge>
              <p className="text-2xl font-bold text-blue-600">{byType.APPLICATION}</p>
              <p className="text-xs text-gray-600">unique cases</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <Badge className="bg-purple-100 text-purple-700 mb-1">TECH</Badge>
              <p className="text-2xl font-bold text-purple-600">{byType.TECH}</p>
              <p className="text-xs text-gray-600">unique cases</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <Badge className="bg-yellow-100 text-yellow-700 mb-1">STAR</Badge>
              <p className="text-2xl font-bold text-yellow-600">{byType.STAR}</p>
              <p className="text-xs text-gray-600">unique cases</p>
            </div>
          </div>
        </div>

        {/* Deduplication Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>Deduplication:</strong> Case studies are counted as unique based on the
            combination of Industry + Location + Component. This ensures we're measuring true
            diversity in our case study database.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
