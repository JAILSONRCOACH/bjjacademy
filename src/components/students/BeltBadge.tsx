import { cn } from '@/lib/utils';
import { BeltType, BELT_LABELS, BELT_COLORS } from '@/lib/beltSystem';

interface BeltBadgeProps {
  belt: BeltType | string;
  stripes?: number;
  size?: 'sm' | 'md' | 'lg';
  showStripes?: boolean;
}

export function BeltBadge({ belt, stripes = 0, size = 'md', showStripes = true }: BeltBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const beltKey = belt as BeltType;
  const beltColor = BELT_COLORS[beltKey] || BELT_COLORS.white;
  const label = BELT_LABELS[beltKey] || 'Branca';

  // Create gradient for two-tone belts
  const getBackgroundStyle = () => {
    if (beltColor.secondary) {
      return {
        background: `linear-gradient(90deg, ${beltColor.primary} 50%, ${beltColor.secondary} 50%)`,
      };
    }
    return {
      backgroundColor: beltColor.primary,
    };
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'rounded-md font-medium inline-flex items-center gap-1 border border-border/50',
          beltColor.textColor,
          sizeClasses[size]
        )}
        style={getBackgroundStyle()}
      >
        {label}
      </span>
      {showStripes && stripes > 0 && (
        <div className="flex gap-0.5">
          {Array.from({ length: stripes }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-4 bg-foreground/70 rounded-sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}
