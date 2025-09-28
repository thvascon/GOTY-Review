import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCommentCardProps {
  userName: string;
  rating: number;
  comment: string | null;
}

const getRatingColor = (currentRating: number) => {
  if (currentRating >= 8) return 'text-green-400';
  if (currentRating >= 6) return 'text-yellow-400';
  return 'text-red-400';
};

export const UserCommentCard = ({ 
  userName, 
  rating, 
  comment 
}: UserCommentCardProps) => {

  const colorClass = getRatingColor(rating);

  const hasComment = !!comment?.trim();

  return (
    <div className="border-b border-border pb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="font-semibold text-foreground">{userName}</p>
        <div className="flex items-center gap-2">
          <span className={cn("font-bold tabular-nums", colorClass)}>
            {rating}/10
          </span>
          <Star size={16} className={cn("fill-current", colorClass)} />
        </div>
      </div>

      <p className="text-muted-foreground text-sm italic">
        {hasComment 
          ? comment 
          : "(O usuário deixou apenas a nota.)"}
      </p>
    </div>
  );
};