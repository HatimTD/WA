'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BadgeDisplay from '@/components/badge-display';
import { Trophy, Medal, Award, TrendingUp, Globe, MapPin, Loader2 } from 'lucide-react';
import { Badge as BadgeType } from '@prisma/client';
import { waGetLeaderboardData, waGetAvailableRegions, type LeaderboardUser } from '@/lib/actions/waLeaderboardActions';

export default function LeaderboardClient() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [regions, setRegions] = useState<string[]>([]);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load regions on mount
  useEffect(() => {
    waLoadRegions();
    waLoadLeaderboard('all');
  }, []);

  const waLoadRegions = async () => {
    const result = await waGetAvailableRegions();
    if (result.success && result.regions) {
      setRegions(result.regions);
    }
  };

  const waLoadLeaderboard = async (region: string) => {
    setIsLoading(true);
    const result = await waGetLeaderboardData(region === 'all' ? null : region);
    if (result.success) {
      setUsers(result.users || []);
      setCurrentUserRank(result.currentUserRank || null);
      setCurrentUser(result.currentUser || null);
      setCurrentUserId(result.currentUserId || '');
    }
    setIsLoading(false);
  };

  const waHandleRegionChange = (region: string) => {
    setSelectedRegion(region);
    waLoadLeaderboard(region);
  };

  const waGetRankIcon = (rank: number) => {
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

  const waGetRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-700';
      case 2:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700';
      case 3:
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-700';
      default:
        return 'bg-white border-gray-200 dark:bg-card dark:border-border';
    }
  };

  const topThree = users.slice(0, 3);
  const restOfUsers = users.slice(3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-wa-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Region Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-foreground">Leaderboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-muted-foreground mt-1">
            {selectedRegion === 'all' ? 'Global rankings' : `${selectedRegion} regional rankings`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRegion} onValueChange={waHandleRegionChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Global (All Regions)
                </div>
              </SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {region}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-wa-green-500 dark:text-primary" />
        </div>
      </div>

      {/* Region Badge */}
      {selectedRegion !== 'all' && (
        <Badge variant="outline" className="bg-wa-green-50 text-wa-green-700 border-wa-green-300 dark:bg-wa-green-900/20 dark:text-wa-green-400 dark:border-wa-green-700">
          <MapPin className="h-3 w-3 mr-1" />
          Showing {selectedRegion} region only
        </Badge>
      )}

      {/* Current User Stats */}
      {currentUser && (
        <Card role="article" className="border-wa-green-200 bg-wa-green-50 dark:border-primary dark:bg-accent">
          <CardHeader>
            <CardTitle className="text-lg dark:text-foreground">
              Your {selectedRegion === 'all' ? 'Global' : 'Regional'} Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-wa-green-600 dark:text-primary">
                  {currentUserRank ? `#${currentUserRank}` : 'N/A'}
                </div>
                <div>
                  <p className="font-medium dark:text-foreground">{currentUser.name}</p>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    {currentUser.totalPoints} points • {currentUser.approvedCases} approved cases
                    {currentUser.region && (
                      <span className="ml-2">
                        <MapPin className="h-3 w-3 inline" /> {currentUser.region}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {currentUser.badges && currentUser.badges.length > 0 && (
                <BadgeDisplay badges={currentUser.badges} size="md" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {users.length === 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">No contributors in this region</h3>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
              Try selecting a different region or view global rankings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1st Place */}
          {topThree[0] && (
            <Card role="article" className={`border-2 ${waGetRankColor(1)} order-1 sm:order-2`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{waGetRankIcon(1)}</div>
                <CardTitle className="text-lg sm:text-xl dark:text-foreground">{topThree[0].name}</CardTitle>
                <CardDescription className="text-xs truncate dark:text-muted-foreground">
                  {topThree[0].email}
                  {topThree[0].region && (
                    <span className="block mt-1">
                      <MapPin className="h-3 w-3 inline" /> {topThree[0].region}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-3xl sm:text-4xl font-bold text-yellow-600 dark:text-yellow-400">{topThree[0].totalPoints}</div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">points</p>
                <Badge variant="outline" className="dark:border-border dark:text-foreground">{topThree[0].approvedCases} approved</Badge>
                {topThree[0].badges && topThree[0].badges.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <BadgeDisplay badges={topThree[0].badges} showLabels={false} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 2nd Place */}
          {topThree[1] && (
            <Card role="article" className={`border-2 ${waGetRankColor(2)} order-2 sm:order-1 sm:mt-8`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{waGetRankIcon(2)}</div>
                <CardTitle className="text-lg dark:text-foreground">{topThree[1].name}</CardTitle>
                <CardDescription className="text-xs truncate dark:text-muted-foreground">
                  {topThree[1].email}
                  {topThree[1].region && (
                    <span className="block mt-1">
                      <MapPin className="h-3 w-3 inline" /> {topThree[1].region}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-foreground">{topThree[1].totalPoints}</div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">points</p>
                <Badge variant="outline" className="dark:border-border dark:text-foreground">{topThree[1].approvedCases} approved</Badge>
                {topThree[1].badges && topThree[1].badges.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <BadgeDisplay badges={topThree[1].badges} showLabels={false} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <Card role="article" className={`border-2 ${waGetRankColor(3)} order-3 sm:mt-8`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{waGetRankIcon(3)}</div>
                <CardTitle className="text-lg dark:text-foreground">{topThree[2].name}</CardTitle>
                <CardDescription className="text-xs truncate dark:text-muted-foreground">
                  {topThree[2].email}
                  {topThree[2].region && (
                    <span className="block mt-1">
                      <MapPin className="h-3 w-3 inline" /> {topThree[2].region}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">{topThree[2].totalPoints}</div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">points</p>
                <Badge variant="outline" className="dark:border-border dark:text-foreground">{topThree[2].approvedCases} approved</Badge>
                {topThree[2].badges && topThree[2].badges.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <BadgeDisplay badges={topThree[2].badges} showLabels={false} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Rest of Rankings */}
      {restOfUsers.length > 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">All Contributors</CardTitle>
            <CardDescription className="dark:text-muted-foreground">
              {selectedRegion === 'all' ? 'Complete global rankings' : `${selectedRegion} regional rankings`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restOfUsers.map((user, index) => {
                const rank = index + 4;
                const isCurrentUser = user.id === currentUserId;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser ? 'bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary' : 'bg-gray-50 border-gray-200 dark:bg-background dark:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`text-lg font-semibold w-10 text-center ${
                          isCurrentUser ? 'text-wa-green-600 dark:text-primary' : 'text-gray-600 dark:text-muted-foreground'
                        }`}
                      >
                        #{rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium dark:text-foreground">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground truncate">
                          {user.email}
                          {user.region && selectedRegion === 'all' && (
                            <span className="ml-2 text-xs">
                              <MapPin className="h-3 w-3 inline" /> {user.region}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold dark:text-foreground">{user.totalPoints}</p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground">{user.approvedCases} approved</p>
                      </div>
                      {user.badges && user.badges.length > 0 && (
                        <div className="ml-4">
                          <BadgeDisplay badges={user.badges} showLabels={false} size="sm" />
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
