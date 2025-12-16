'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get all system configuration values
 */
export async function waGetSystemConfig() {
  try {
    const configs = await prisma.waSystemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert array to object for easier access
    const configObject: Record<string, string> = {};
    configs.forEach((config) => {
      configObject[config.key] = config.value;
    });

    return { success: true, config: configObject };
  } catch (error) {
    console.error('[waGetSystemConfig] Error:', error);
    return { success: false, error: 'Failed to fetch system configuration' };
  }
}

/**
 * Get a specific configuration value by key
 */
export async function waGetConfigValue(key: string): Promise<string | null> {
  try {
    const config = await prisma.waSystemConfig.findUnique({
      where: { key },
    });

    return config?.value || null;
  } catch (error) {
    console.error(`[waGetConfigValue] Error for key ${key}:`, error);
    return null;
  }
}

/**
 * Update system configuration (ADMIN only)
 */
export async function waUpdateSystemConfig(configs: Record<string, string>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Only admins can update system configuration' };
    }

    // Update all configs
    for (const [key, value] of Object.entries(configs)) {
      await prisma.waSystemConfig.upsert({
        where: { key },
        update: {
          value,
          updatedBy: session.user.id,
        },
        create: {
          key,
          value,
          updatedBy: session.user.id,
        },
      });
    }

    // Revalidate pages that use system config
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bhag');
    revalidatePath('/dashboard/leaderboard');
    revalidatePath('/dashboard/admin/config');

    return { success: true, message: 'System configuration updated successfully' };
  } catch (error) {
    console.error('[waUpdateSystemConfig] Error:', error);
    return { success: false, error: 'Failed to update system configuration' };
  }
}

/**
 * Get BHAG target from system config
 */
export async function waGetBHAGTarget(): Promise<number> {
  const target = await waGetConfigValue('bhag_target');
  return target ? parseInt(target, 10) : 1000; // Default to 1000
}

/**
 * Get point values for case types
 */
export async function waGetPointValues() {
  const [appPoints, techPoints, starPoints] = await Promise.all([
    waGetConfigValue('points_application'),
    waGetConfigValue('points_tech'),
    waGetConfigValue('points_star'),
  ]);

  return {
    APPLICATION: appPoints ? parseInt(appPoints, 10) : 1,
    TECH: techPoints ? parseInt(techPoints, 10) : 2,
    STAR: starPoints ? parseInt(starPoints, 10) : 3,
  };
}

/**
 * Get badge thresholds
 */
export async function waGetBadgeThresholds() {
  const [explorer, expert, champion] = await Promise.all([
    waGetConfigValue('badge_explorer_threshold'),
    waGetConfigValue('badge_expert_threshold'),
    waGetConfigValue('badge_champion_threshold'),
  ]);

  return {
    EXPLORER: explorer ? parseInt(explorer, 10) : 10,
    EXPERT: expert ? parseInt(expert, 10) : 10,
    CHAMPION: champion ? parseInt(champion, 10) : 10,
  };
}
