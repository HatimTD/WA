import { Badge } from '@prisma/client';
import { Trophy, Star, Target } from 'lucide-react';
import { Badge as UIBadge } from '@/components/ui/badge';

type Props = {
  badges: Badge[];
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const BADGE_CONFIG = {
  EXPLORER: {
    icon: Target,
    label: 'Explorer',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: '10 Application cases approved',
  },
  EXPERT: {
    icon: Star,
    label: 'Expert',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: '10 Tech cases approved',
  },
  CHAMPION: {
    icon: Trophy,
    label: 'Champion',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    description: '10 Star cases approved',
  },
};

export default function BadgeDisplay({ badges, showLabels = true, size = 'md' }: Props) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  const badgeSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <UIBadge
            key={badge}
            variant="outline"
            className={`${config.color} ${badgeSize} flex items-center gap-1 border`}
            title={config.description}
          >
            <Icon className={iconSize} />
            {showLabels && <span>{config.label}</span>}
          </UIBadge>
        );
      })}
    </div>
  );
}
