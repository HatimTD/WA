'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { waUpdateSystemConfig } from '@/lib/actions/waSystemConfigActions';
import { Loader2, Save, RotateCcw } from 'lucide-react';

interface SystemConfigFormProps {
  initialConfig: Record<string, string>;
}

export function SystemConfigForm({ initialConfig }: SystemConfigFormProps) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setConfig(initialConfig);
    toast.info('Configuration reset to saved values');
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await waUpdateSystemConfig(config);

      if (result.success) {
        toast.success('System configuration updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('[SystemConfigForm] Save error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BHAG Target */}
      <Card>
        <CardHeader>
          <CardTitle>BHAG Target</CardTitle>
          <CardDescription>
            Big Hairy Audacious Goal - Target number of approved case studies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="bhag_target">Target Number of Approved Cases</Label>
            <Input
              id="bhag_target"
              type="number"
              min="1"
              value={config.bhag_target || '1000'}
              onChange={(e) => handleChange('bhag_target', e.target.value)}
              disabled={isSaving}
            />
            <p className="text-sm text-gray-500">
              Currently set to {config.bhag_target || '1000'} approved case studies
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Point Values */}
      <Card>
        <CardHeader>
          <CardTitle>Point Values</CardTitle>
          <CardDescription>
            Points awarded for each case study type when approved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="points_application">Application Case Studies</Label>
              <Input
                id="points_application"
                type="number"
                min="0"
                value={config.points_application || '1'}
                onChange={(e) => handleChange('points_application', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                Currently: {config.points_application || '1'} point
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_tech">Tech Case Studies</Label>
              <Input
                id="points_tech"
                type="number"
                min="0"
                value={config.points_tech || '2'}
                onChange={(e) => handleChange('points_tech', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                Currently: {config.points_tech || '2'} points
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_star">Star Case Studies (without WPS)</Label>
              <Input
                id="points_star"
                type="number"
                min="0"
                value={config.points_star || '3'}
                onChange={(e) => handleChange('points_star', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                Currently: {config.points_star || '3'} points
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_star_with_wps">Star Case Studies (with WPS bonus)</Label>
              <Input
                id="points_star_with_wps"
                type="number"
                min="0"
                value={config.points_star_with_wps || '4'}
                onChange={(e) => handleChange('points_star_with_wps', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                Currently: {config.points_star_with_wps || '4'} points (WPS is optional for STAR)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Thresholds</CardTitle>
          <CardDescription>
            Number of approved cases required to earn each badge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="badge_explorer_threshold">Explorer Badge</Label>
              <Input
                id="badge_explorer_threshold"
                type="number"
                min="1"
                value={config.badge_explorer_threshold || '10'}
                onChange={(e) => handleChange('badge_explorer_threshold', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                {config.badge_explorer_threshold || '10'} Application case studies
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge_expert_threshold">Expert Badge</Label>
              <Input
                id="badge_expert_threshold"
                type="number"
                min="1"
                value={config.badge_expert_threshold || '10'}
                onChange={(e) => handleChange('badge_expert_threshold', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                {config.badge_expert_threshold || '10'} Tech case studies
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge_champion_threshold">Champion Badge</Label>
              <Input
                id="badge_champion_threshold"
                type="number"
                min="1"
                value={config.badge_champion_threshold || '10'}
                onChange={(e) => handleChange('badge_champion_threshold', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                {config.badge_champion_threshold || '10'} Star case studies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
