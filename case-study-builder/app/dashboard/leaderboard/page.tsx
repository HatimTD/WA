import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BadgeDisplay from '@/components/badge-display';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Badge as BadgeType } from '@prisma/client';

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get all users ranked by points
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      totalPoints: true,
      badges: true,
      _count: {
        select: {
          caseStudies: {
            where: { status: 'APPROVED' },
          },
        },
      },
    },
    orderBy: {
      totalPoints: 'desc',
    },
  });

  // Find current user's rank
  const currentUserRank = users.findIndex((u) => u.id === session.user.id) + 1;
  const currentUser = users.find((u) => u.id === session.user.id);

  // Get top 3 for podium display
  const topThree = users.slice(0, 3);
  const restOfUsers = users.slice(3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-gray-600 mt-1">See how you rank among contributors</p>
        </div>
        <TrendingUp className="h-12 w-12 text-blue-500" />
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-blue-600">#{currentUserRank}</div>
                <div>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-gray-600">
                    {currentUser.totalPoints} points • {currentUser._count.caseStudies} approved cases
                  </p>
                </div>
              </div>
              {currentUser.badges && (currentUser.badges as BadgeType[]).length > 0 && (
                <BadgeDisplay badges={currentUser.badges as BadgeType[]} size="md" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          {topThree[1] && (
            <Card className={`border-2 ${getRankColor(2)} mt-8`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{getRankIcon(2)}</div>
                <CardTitle className="text-lg">{topThree[1].name}</CardTitle>
                <CardDescription className="text-xs truncate">{topThree[1].email}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-3xl font-bold text-gray-700">{topThree[1].totalPoints}</div>
                <p className="text-sm text-gray-600">points</p>
                <Badge variant="outline">{topThree[1]._count.caseStudies} approved</Badge>
                {topThree[1].badges && (topThree[1].badges as BadgeType[]).length > 0 && (
                  <div className="flex justify-center pt-2">
                    <BadgeDisplay badges={topThree[1].badges as BadgeType[]} showLabels={false} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <Card className={`border-2 ${getRankColor(1)}`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{getRankIcon(1)}</div>
                <CardTitle className="text-xl">{topThree[0].name}</CardTitle>
                <CardDescription className="text-xs truncate">{topThree[0].email}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-4xl font-bold text-yellow-600">{topThree[0].totalPoints}</div>
                <p className="text-sm text-gray-600">points</p>
                <Badge variant="outline">{topThree[0]._count.caseStudies} approved</Badge>
                {topThree[0].badges && (topThree[0].badges as BadgeType[]).length > 0 && (
                  <div className="flex justify-center pt-2">
                    <BadgeDisplay badges={topThree[0].badges as BadgeType[]} showLabels={false} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <Card className={`border-2 ${getRankColor(3)} mt-8`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{getRankIcon(3)}</div>
                <CardTitle className="text-lg">{topThree[2].name}</CardTitle>
                <CardDescription className="text-xs truncate">{topThree[2].email}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-3xl font-bold text-amber-700">{topThree[2].totalPoints}</div>
                <p className="text-sm text-gray-600">points</p>
                <Badge variant="outline">{topThree[2]._count.caseStudies} approved</Badge>
                {topThree[2].badges && (topThree[2].badges as BadgeType[]).length > 0 && (
                  <div className="flex justify-center pt-2">
                    <BadgeDisplay badges={topThree[2].badges as BadgeType[]} showLabels={false} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Rest of Rankings */}
      {restOfUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Contributors</CardTitle>
            <CardDescription>Complete leaderboard rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restOfUsers.map((user, index) => {
                const rank = index + 4;
                const isCurrentUser = user.id === session.user.id;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`text-lg font-semibold w-10 text-center ${
                          isCurrentUser ? 'text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        #{rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{user.totalPoints}</p>
                        <p className="text-xs text-gray-500">{user._count.caseStudies} approved</p>
                      </div>
                      {user.badges && (user.badges as BadgeType[]).length > 0 && (
                        <div className="ml-4">
                          <BadgeDisplay badges={user.badges as BadgeType[]} showLabels={false} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
