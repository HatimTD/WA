'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkX, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SavedCase {
  id: string;
  createdAt: string;
  caseStudy: {
    id: string;
    customerName: string;
    industry: string;
    location: string;
    componentWorkpiece: string;
    type: string;
    waProduct: string;
    problemDescription: string;
    status: string;
    approvedAt: string;
  };
}

export default function SavedCasesPage() {
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedCases();
  }, []);

  const fetchSavedCases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-cases');
      const data = await response.json();

      if (response.ok) {
        setSavedCases(data.savedCases);
      } else {
        toast.error(data.error || 'Failed to load saved cases');
      }
    } catch (error) {
      console.error('Error fetching saved cases:', error);
      toast.error('Failed to load saved cases');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSave = async (caseStudyId: string) => {
    try {
      setRemovingId(caseStudyId);
      const response = await fetch(`/api/saved-cases?caseStudyId=${caseStudyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedCases((prev) => prev.filter((saved) => saved.caseStudy.id !== caseStudyId));
        toast.success('Case study removed from saved');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove save');
      }
    } catch (error) {
      console.error('Error removing save:', error);
      toast.error('Failed to remove save');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark className="h-8 w-8 text-blue-600" />
          Saved Cases
        </h1>
        <p className="text-gray-600 mt-2">
          Access your saved case studies for quick reference
        </p>
      </div>

      {/* Saved Cases Count */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900">
            {savedCases.length} Saved {savedCases.length === 1 ? 'Case' : 'Cases'}
          </CardTitle>
          <CardDescription className="text-blue-700">
            Case studies you've bookmarked for later
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Saved Cases Grid */}
      {savedCases.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">No saved cases yet</p>
          <p className="text-gray-400 text-sm mb-6">
            Start exploring case studies and save the ones you find interesting
          </p>
          <Link href="/dashboard/search">
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Browse Case Studies
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedCases.map((saved) => (
            <Card
              key={saved.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {saved.caseStudy.customerName}
                  </CardTitle>
                  <Badge
                    variant={
                      saved.caseStudy.type === 'STAR'
                        ? 'default'
                        : saved.caseStudy.type === 'TECH'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="shrink-0"
                  >
                    {saved.caseStudy.type}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-1">
                  {saved.caseStudy.industry} • {saved.caseStudy.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Component:</span>{' '}
                    {saved.caseStudy.componentWorkpiece}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Product:</span> {saved.caseStudy.waProduct}
                  </p>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {saved.caseStudy.problemDescription}
                </p>
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/cases/${saved.caseStudy.id}`} className="flex-1">
                    <Button className="w-full gap-2" size="sm">
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSave(saved.caseStudy.id)}
                    disabled={removingId === saved.caseStudy.id}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingId === saved.caseStudy.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <BookmarkX className="h-3 w-3" />
                    )}
                    Remove
                  </Button>
                </div>
                <p className="text-xs text-gray-400 text-center pt-2 border-t">
                  Saved {new Date(saved.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
