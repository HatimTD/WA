'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award } from 'lucide-react';

// Color palette
const COLORS = {
  waGreen: 'hsl(142, 71%, 45%)',
  purple: 'hsl(271, 91%, 65%)',
  green: 'hsl(142, 71%, 45%)',
  orange: 'hsl(25, 95%, 53%)',
  red: 'hsl(0, 84%, 60%)',
  yellow: 'hsl(48, 96%, 53%)',
  cyan: 'hsl(189, 94%, 43%)',
  pink: 'hsl(330, 81%, 60%)',
  gray: 'hsl(215, 16%, 47%)',
};

const STATUS_COLORS = {
  DRAFT: COLORS.gray,
  SUBMITTED: COLORS.orange,
  APPROVED: COLORS.green,
  REJECTED: COLORS.red,
  PUBLISHED: COLORS.waGreen,
};

const TYPE_COLORS = {
  APPLICATION: COLORS.waGreen,
  TECH: COLORS.purple,
  STAR: COLORS.yellow,
};

// Admin Charts View
export function AdminChartsView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Cases Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Total Case Studies Over Time</CardTitle>
          <CardDescription>New case studies created each month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: 'Cases',
                color: COLORS.waGreen,
              },
            }}
            className="h-[300px]"
          >
            <LineChart data={data.casesOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.waGreen}
                strokeWidth={2}
                dot={{ fill: COLORS.waGreen, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cases by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Case Studies by Type</CardTitle>
            <CardDescription>Distribution across case types</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                APPLICATION: { label: 'Application', color: TYPE_COLORS.APPLICATION },
                TECH: { label: 'Tech', color: TYPE_COLORS.TECH },
                STAR: { label: 'Star', color: TYPE_COLORS.STAR },
              }}
              className="h-[300px]"
            >
              <BarChart data={data.casesByType}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="type"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.casesByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cases by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Case Studies by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cases', color: COLORS.waGreen },
              }}
              className="h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data.casesByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {data.casesByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cases by Industry */}
      <Card>
        <CardHeader>
          <CardTitle>Top Industries</CardTitle>
          <CardDescription>Most common industries in case studies</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: 'Cases', color: COLORS.purple },
            }}
            className="h-[350px]"
          >
            <BarChart data={data.casesByIndustry} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                type="category"
                dataKey="industry"
                className="text-xs"
                width={120}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill={COLORS.purple} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Top Contributors
          </CardTitle>
          <CardDescription>Users with the highest points</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              points: { label: 'Points', color: COLORS.orange },
            }}
            className="h-[350px]"
          >
            <BarChart data={data.topContributors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs"
                width={120}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="points" fill={COLORS.orange} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Approval Rate Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Rate Trend</CardTitle>
          <CardDescription>Monthly approval rate percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              rate: { label: 'Approval Rate %', color: COLORS.green },
            }}
            className="h-[300px]"
          >
            <AreaChart data={data.approvalRateOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={COLORS.green}
                fill={COLORS.green}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Contributor Charts View
export function ContributorChartsView({ data }: { data: any }) {
  const badgeTargets = {
    EXPLORER: 10,
    EXPERT: 10,
    CHAMPION: 10,
  };

  return (
    <div className="space-y-6">
      {/* Submissions Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>My Submissions Over Time</CardTitle>
          <CardDescription>Your case study submissions by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: 'Submissions', color: COLORS.blue },
            }}
            className="h-[300px]"
          >
            <LineChart data={data.submissionsOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.waGreen}
                strokeWidth={2}
                dot={{ fill: COLORS.waGreen, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cases by Type */}
        <Card>
          <CardHeader>
            <CardTitle>My Cases by Type</CardTitle>
            <CardDescription>Distribution of your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cases', color: COLORS.waGreen },
              }}
              className="h-[300px]"
            >
              <BarChart data={data.casesByType}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="type"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.casesByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cases by Status */}
        <Card>
          <CardHeader>
            <CardTitle>My Cases by Status</CardTitle>
            <CardDescription>Current status of your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cases', color: COLORS.waGreen },
              }}
              className="h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data.casesByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {data.casesByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Badge Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Progress</CardTitle>
          <CardDescription>Your progress towards earning badges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-wa-green-50">
                  EXPLORER
                </Badge>
                <span className="text-sm text-gray-600">
                  {data.badgeProgress.EXPLORER} / {badgeTargets.EXPLORER} Application Cases
                </span>
              </div>
              {data.earnedBadges.includes('EXPLORER') && (
                <Award className="h-5 w-5 text-wa-green-600" />
              )}
            </div>
            <Progress
              value={(data.badgeProgress.EXPLORER / badgeTargets.EXPLORER) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-50">
                  EXPERT
                </Badge>
                <span className="text-sm text-gray-600">
                  {data.badgeProgress.EXPERT} / {badgeTargets.EXPERT} Tech Cases
                </span>
              </div>
              {data.earnedBadges.includes('EXPERT') && (
                <Award className="h-5 w-5 text-purple-600" />
              )}
            </div>
            <Progress
              value={(data.badgeProgress.EXPERT / badgeTargets.EXPERT) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500">CHAMPION</Badge>
                <span className="text-sm text-gray-600">
                  {data.badgeProgress.CHAMPION} / {badgeTargets.CHAMPION} Star Cases
                </span>
              </div>
              {data.earnedBadges.includes('CHAMPION') && (
                <Award className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <Progress
              value={(data.badgeProgress.CHAMPION / badgeTargets.CHAMPION) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Success Rate</CardTitle>
          <CardDescription>
            Approved vs Rejected ({data.successRate.percentage}% approval rate)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: { label: 'Cases', color: COLORS.green },
            }}
            className="h-[300px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={[
                  { name: 'Approved', value: data.successRate.approved, fill: COLORS.green },
                  { name: 'Rejected', value: data.successRate.rejected, fill: COLORS.red },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={(entry) => `${entry.name}: ${entry.value}`}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Approver Charts View
export function ApproverChartsView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Reviews Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Cases Reviewed Over Time</CardTitle>
          <CardDescription>Your review activity by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              approved: { label: 'Approved', color: COLORS.green },
              rejected: { label: 'Rejected', color: COLORS.red },
              total: { label: 'Total', color: COLORS.blue },
            }}
            className="h-[300px]"
          >
            <LineChart data={data.reviewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="approved"
                stroke={COLORS.green}
                strokeWidth={2}
                dot={{ fill: COLORS.green, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="rejected"
                stroke={COLORS.red}
                strokeWidth={2}
                dot={{ fill: COLORS.red, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLORS.waGreen}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: COLORS.waGreen, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Approval vs Rejection Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Approval vs Rejection Rate</CardTitle>
            <CardDescription>
              Overall distribution ({data.approvalRate.percentage}% approval)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: 'Cases', color: COLORS.waGreen },
              }}
              className="h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={[
                    {
                      name: 'Approved',
                      value: data.approvalRate.approved,
                      fill: COLORS.green,
                    },
                    {
                      name: 'Rejected',
                      value: data.approvalRate.rejected,
                      fill: COLORS.red,
                    },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cases by Type Reviewed */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Type Reviewed</CardTitle>
            <CardDescription>Distribution of case types you reviewed</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cases', color: COLORS.waGreen },
              }}
              className="h-[300px]"
            >
              <BarChart data={data.reviewedByType}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="type"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.reviewedByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Average Review Time */}
      <Card>
        <CardHeader>
          <CardTitle>Average Review Time</CardTitle>
          <CardDescription>Average days to review by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              avgDays: { label: 'Avg Days', color: COLORS.purple },
            }}
            className="h-[300px]"
          >
            <BarChart data={data.reviewTimesByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgDays" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Viewer Charts View
export function ViewerChartsView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Cases by Industry */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Cases by Industry</CardTitle>
          <CardDescription>Top industries with most case studies</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: 'Cases', color: COLORS.blue },
            }}
            className="h-[350px]"
          >
            <BarChart data={data.casesByIndustry} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                type="category"
                dataKey="industry"
                className="text-xs"
                width={120}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill={COLORS.blue} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cases by Region */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Region</CardTitle>
            <CardDescription>Geographic distribution of cases</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cases', color: COLORS.green },
              }}
              className="h-[350px]"
            >
              <BarChart data={data.casesByRegion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  type="category"
                  dataKey="region"
                  className="text-xs"
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={COLORS.green} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular WA Products</CardTitle>
            <CardDescription>Top products featured in cases</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cases', color: COLORS.orange },
              }}
              className="h-[350px]"
            >
              <BarChart data={data.popularProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  type="category"
                  dataKey="product"
                  className="text-xs"
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={COLORS.orange} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
