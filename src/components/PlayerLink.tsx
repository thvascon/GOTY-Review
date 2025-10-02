import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerLinkProps {
  playerId: string;
  playerName: string;
  avatarUrl?: string | null;
  showAvatar?: boolean;
  className?: string;
}

export const PlayerLink = ({ 
  playerId, 
  playerName, 
  avatarUrl, 
  showAvatar = false,
  className = ""
}: PlayerLinkProps) => {
  return (
    <Link 
      to={`/profile?id=${playerId}`}
      className={`inline-flex items-center gap-2 hover:underline text-foreground hover:text-primary transition-colors ${className}`}
    >
      {showAvatar && (
        <Avatar className="w-6 h-6">
          <AvatarImage src={avatarUrl || undefined} alt={playerName} />
          <AvatarFallback className="text-xs">
            {playerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <span>{playerName}</span>
    </Link>
  );
};