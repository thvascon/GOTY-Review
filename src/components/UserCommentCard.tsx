import { StarRating } from './StarRating';
import { PlayerLink } from './PlayerLink';

interface UserCommentCardProps {
  playerId: string;
  userName: string;
  avatarUrl?: string | null;
  rating: number;
  comment: string | null;
}

export const UserCommentCard = ({ 
  playerId,
  userName, 
  avatarUrl,
  rating, 
  comment 
}: UserCommentCardProps) => {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-start justify-between gap-3 mb-2">
        <PlayerLink 
          playerId={playerId}
          playerName={userName}
          avatarUrl={avatarUrl}
          showAvatar={true}
          className="font-semibold"
        />
        <div className="flex-shrink-0">
          <StarRating 
            rating={rating} 
            onRatingChange={() => {}} 
            disabled 
            size={14}
          />
        </div>
      </div>
      {comment && (
        <p className="text-sm text-muted-foreground mt-2 italic">
          "{comment}"
        </p>
      )}
    </div>
  );
};