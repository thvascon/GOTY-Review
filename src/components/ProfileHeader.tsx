import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gamepad2, Star, Calendar, Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProfileHeaderProps {
  profile: {
    name: string;
    avatar_url: string | null;
  };
  stats: {
    total: number;
    average: number | string;
    memberSince: string;
  };
  bannerImage: string | null | undefined;
  onEditClick: () => void;
}

export const ProfileHeader = ({
  profile,
  stats,
  bannerImage,
  onEditClick,
}: ProfileHeaderProps) => {
  return (
    <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
        <Button asChild variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-20 text-white">
        <Link to="/">
          <ArrowLeft />
        </Link>
      </Button>
      <div className="absolute inset-0 overflow-hidden">
        {bannerImage && (
          <img
            src={bannerImage}
            alt="Banner do perfil"
            className="w-full h-full object-cover object-center blur-sm"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-background/60 to-background" />

      <div className="relative h-full w-full flex items-end pb-6 md:pb-8">
        <div className="container mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-full items-center md:items-start">
            <Avatar className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 border-4 border-background shadow-lg flex-shrink-0">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="text-2xl md:text-4xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                {profile.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-x-3 md:gap-x-4 gap-y-1 mt-2 md:mt-3 text-gray-300">
                <span className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Gamepad2 size={14} className="md:w-4 md:h-4" /> {stats.total} jogos avaliados
                </span>
                <span className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Star size={14} className="md:w-4 md:h-4" /> {stats.average} média
                </span>
                <span className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Calendar size={14} className="md:w-4 md:h-4" /> Desde {stats.memberSince}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditClick}
                  className="text-gray-300 hover:text-white hover:bg-white/10 h-8 w-8"
                >
                  <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};