// Arquivo: src/pages/Profile.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Gamepad2, Star, Calendar } from "lucide-react";
import { StarRating } from "@/components/StarRating";

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
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Redireciona se o usuário não estiver logado
  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/");
    }
  }, [session, authLoading, navigate]);

  // Preenche o formulário com os dados do perfil quando ele carregar
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // useEffect para buscar as avaliações do usuário
  useEffect(() => {
    if (profile) {
      const fetchReviews = async () => {
        setReviewsLoading(true);
        // Busca na tabela 'reviews' e pede para trazer os dados da tabela 'games' junto
        const { data, error } = await supabase
          .from("reviews")
          .select("created_at, rating, comment, games(id, name, cover_image)")
          .eq("person_id", profile.id)
          .gt("rating", 0)
          .order("created_at", { ascending: false }); // Ordena pelas mais recentes

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

  const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, 3);

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
    }
    setIsSubmitting(false);
  };

  if (authLoading || !profile) {
    return <div className="p-8 text-center">Carregando perfil...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex items-center gap-6 mb-10">
        <Avatar className="w-24 h-24 border-2 border-primary">
          <AvatarImage src={profile.avatar_url} alt={profile.name} />
          <AvatarFallback className="text-3xl">
            {profile.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold">{profile.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Gamepad2 size={14} /> {stats.total} jogos avaliados
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={14} /> {stats.average} média
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> Desde {stats.memberSince}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Jogos Avaliados ({stats.total})
        </h2>
        {reviewsLoading ? (
          <p className="text-muted-foreground">Carregando avaliações...</p>
        ) : (
          <div className="space-y-4">
            {reviewsToShow.map(
              (review) =>
                review.games && (
                  <div
                    key={review.games.id}
                    className="flex gap-4 p-4 bg-card border rounded-lg"
                  >
                    <img
                      src={review.games.cover_image || "/placeholder.svg"}
                      alt={review.games.name}
                      className="w-24 h-32 object-cover rounded-md"
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">
                            {review.games.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {review.comment || "Nenhum comentário detalhado."}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <StarRating
                            rating={review.rating}
                            onRatingChange={() => {}}
                            size={16}
                            disabled
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
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
