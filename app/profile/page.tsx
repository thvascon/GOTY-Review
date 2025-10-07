"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, Upload, X, ArrowLeft } from "lucide-react";
import { StarRating } from "@/components/StarRating";
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
} from "@/components/ui/dialog";
import { ImageCropper } from "@/components/ImageCropper";

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

interface ProfileData {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

function ProfilePageContent() {
  const {
    session,
    profile: loggedInProfile,
    loading: authLoading,
    refetchProfile,
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Redirect para próprio perfil se não tiver ID
  useEffect(() => {
    const id = searchParams.get("id");
    if (!authLoading && !id && loggedInProfile?.id) {
      router.replace(`/profile?id=${loggedInProfile.id}`);
    }
  }, [searchParams, authLoading, loggedInProfile, router]);

  const profileId = searchParams.get("id") || loggedInProfile?.id;
  const isOwnProfile = loggedInProfile?.id === profileId;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      const { data, error } = await supabase
        .from("people")
        .select("id, name, avatar_url, created_at")
        .eq("id", profileId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        toast({
          title: "Erro",
          description: "Perfil não encontrado.",
          variant: "destructive",
        });
        router.push("/");
      } else {
        setProfileData(data);
      }
      setProfileLoading(false);
    };

    fetchProfileData();
  }, [profileId, router, toast]);

  useEffect(() => {
    if (isOwnProfile && loggedInProfile) {
      setName(loggedInProfile.name || "");
      setAvatarUrl(loggedInProfile.avatar_url || "");
      setImagePreview(loggedInProfile.avatar_url || null);
    }
  }, [isOwnProfile, loggedInProfile]);

  useEffect(() => {
    if (profileId) {
      const fetchReviews = async () => {
        setReviewsLoading(true);
        const { data, error } = await supabase
          .from("reviews")
          .select("created_at, rating, comment, games(id, name, cover_image)")
          .eq("person_id", profileId)
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
  }, [profileId]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !loggedInProfile) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description:
          "Por favor, selecione uma imagem válida (JPG, PNG, GIF ou WebP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Criar preview da imagem para o cropper
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!loggedInProfile) return;

    setUploadingImage(true);

    try {
      const fileName = `${loggedInProfile.id}/${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedImageBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      setImagePreview(publicUrl);

      toast({
        title: "Sucesso!",
        description: "Imagem carregada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description:
          error.message || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUrl("");
    setImagePreview(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInProfile || !isOwnProfile) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("people")
      .update({
        name: name,
        avatar_url: avatarUrl,
      })
      .eq("id", loggedInProfile.id);

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
      setProfileData({
        ...profileData!,
        name: name,
        avatar_url: avatarUrl,
      });
    }
    setIsSubmitting(false);
  };

  const stats = useMemo(() => {
    if (!reviews || !profileData)
      return { total: 0, average: 0, memberSince: "" };

    const total = reviews.length;
    const average =
      total > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        : 0;
    const memberSince = new Date(profileData.created_at).toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    );

    return { total, average, memberSince };
  }, [reviews, profileData]);

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
  const bannerImage = sortedReviews[0]?.games?.cover_image;

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <div className="w-full h-64 bg-muted animate-pulse" />
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
            <div className="w-32 h-32 rounded-full bg-muted animate-pulse border-4 border-background" />
          </div>
        </div>
        <div className="mt-20 text-center px-4">
          <div className="h-8 w-48 bg-muted rounded mx-auto mb-4 animate-pulse" />
          <div className="flex justify-center gap-8 mb-8">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Perfil não encontrado</h2>
        <Button asChild>
          <Link href="/">Voltar para a Página Inicial</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Button
        asChild
        variant="ghost"
        className="hidden md:inline-flex absolute top-4 left-4 z-20"
      >
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a Página Inicial
        </Link>
      </Button>

      <ProfileHeader
        profile={{
          name: profileData.name,
          avatar_url: profileData.avatar_url,
        }}
        stats={stats}
        bannerImage={bannerImage}
        onEditClick={() => setIsEditModalOpen(true)}
        showEditButton={isOwnProfile}
      />

      {isOwnProfile && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Upload de Foto */}
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={imagePreview || undefined} />
                    <AvatarFallback className="text-2xl">
                      {name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Escolher Foto
                        </>
                      )}
                    </Button>

                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || uploadingImage}>
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

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
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {isOwnProfile
              ? "Você ainda não avaliou nenhum jogo."
              : "Este usuário ainda não avaliou nenhum jogo."}
          </p>
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

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          open={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando perfil...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
