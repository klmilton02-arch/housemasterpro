import { BADGE_DEFINITIONS } from "@/utils/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function BadgeDisplay({ badges = [], size = "md", interactive = true }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No badges earned yet. Keep completing tasks!</p>
      </div>
    );
  }

  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl"
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-4 justify-center">
        {badges.map(badgeId => {
          const badge = BADGE_DEFINITIONS[badgeId];
          if (!badge) return null;

          const badge_element = (
            <div key={badgeId} className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 ${sizeClasses[size]} hover:shadow-lg transition-shadow`}>
              <span>{badge.icon}</span>
            </div>
          );

          if (!interactive) return badge_element;

          return (
            <Tooltip key={badgeId}>
              <TooltipTrigger asChild>
                {badge_element}
              </TooltipTrigger>
              <TooltipContent side="top" className="text-center">
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}