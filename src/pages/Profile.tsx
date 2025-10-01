import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Gamepad2, Star, Calendar, Edit } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserReview {
  created_at: string;
  rating: number;
  comment: string | null;
  games: {
    id: string;
    name: string;
    cover_image: string | null;
  } | null;
}

const Profile = () => {
  const { session, profile, loading: authLoading, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/");
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const fetchReviews = async () => {
        setReviewsLoading(true);
        const { data, error } = await supabase
          .from("reviews")
          .select("created_at, rating, comment, games(id, name, cover_image)")
          .eq("person_id", profile.id)
          .gt("rating", 0)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar avaliações:", error);
        } else {
          setReviews((data as UserReview[]) || []);
        }
        setReviewsLoading(false);
      };
      fetchReviews();
    }
  }, [profile]);

  const stats = useMemo(() => {
    if (!reviews || !profile) return { total: 0, average: 0, memberSince: "" };

    const total = reviews.length;
    const average =
      total > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        : 0;
    const memberSince = new Date(profile.created_at).toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    );

    return { total, average, memberSince };
  }, [reviews, profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("people")
      .update({
        name: name,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
      await refetchProfile();
      setIsEditModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];

    if (sortBy === "highest") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      sorted.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === "alphabetical") {
      sorted.sort(
        (a, b) => a.games?.name.localeCompare(b.games?.name || "") || 0
      );
    }
    return sorted;
  }, [reviews, sortBy]);

  const reviewsToShow = showAllReviews
    ? sortedReviews
    : sortedReviews.slice(0, 3);
  const bannerImage = sortedReviews[0]?.games.cover_image;

  if (authLoading || !profile) {
    return <div className="p-8 text-center">Carregando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
        <Button asChild variant="ghost" className="hidden md:inline-flex absolute top-4 left-4 z-20">
        <Link to="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a Página Inicial
        </Link>
      </Button>
      <ProfileHeader
        profile={{
          name: profile.name,
          avatar_url: profile.avatar_url ?? null,
        }}
        stats={stats}
        bannerImage={bannerImage}
        onEditClick={() => setIsEditModalOpen(true)}
      />
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-url">URL do Avatar</Label>
              <Input
                id="avatar-url"
                type="url"
                value={avatarUrl || ""}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Exibição</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
          Jogos Avaliados ({stats.total})
        </h2>

        <div className="mb-4 md:mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="highest">Maiores Notas</SelectItem>
              <SelectItem value="lowest">Menores Notas</SelectItem>
              <SelectItem value="alphabetical">Ordem Alfabética</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reviewsLoading ? (
          <p className="text-muted-foreground">Carregando avaliações...</p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {reviewsToShow.map(
              (review) =>
                review.games && (
                  <div
                    key={review.games.id}
                    className="flex flex-col sm:flex-row gap-3 md:gap-4 p-3 md:p-4 bg-card border rounded-lg transition-all hover:bg-muted hover:scale-[1.02]"
                  >
                    <img
                      src={review.games.cover_image || "/placeholder.svg"}
                      alt={review.games.name}
                      className="w-full sm:w-24 md:w-32 h-32 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-grow space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-grow">
                          <h3 className="font-bold text-base md:text-lg">
                            {review.games.name}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2 italic line-clamp-3 sm:line-clamp-none">
                            {review.comment || "Nenhum comentário detalhado."}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <StarRating
                            rating={review.rating}
                            onRatingChange={() => {}}
                            size={14}
                            disabled
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar
                            size={12}
                            className="md:w-[14px] md:h-[14px]"
                          />
                          Avaliado em{" "}
                          {new Date(review.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                )
            )}
            {!showAllReviews && reviews.length > 3 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAllReviews(true)}
              >
                Mostrar todas as {reviews.length} avaliações
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
