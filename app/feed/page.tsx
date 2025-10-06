"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { ArrowLeft, Activity, Gamepad2, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  created_at: string;
  person_id: string;
  activity_type: string;
  game_id: string | null;
  rating: number | null;
  group_id: string | null;
  metadata: {
    game_name?: string;
    game_cover?: string;
    person_name?: string;
    comment?: string;
    genres?: string[];
  };
}

export default function FeedPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/");
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!profile?.group_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("group_id", profile.group_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro ao buscar atividades:", error);
      } else {
        setActivities((data as ActivityItem[]) || []);
      }
      setLoading(false);
    };

    if (session && profile?.group_id) {
      fetchActivities();

      const channel = supabase
        .channel("activities-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activities",
            filter: `group_id=eq.${profile.group_id}`
          },
          (payload) => {
            setActivities((prev) => [payload.new as ActivityItem, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, profile]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "review":
        return <Star className="w-5 h-5 text-yellow-500" />;
      case "game_added":
        return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const personName = activity.metadata.person_name || "Alguém";
    const gameName = activity.metadata.game_name || "um jogo";

    switch (activity.activity_type) {
      case "review":
        return (
          <>
            <Link
              href={`/profile?id=${activity.person_id}`}
              className="font-semibold hover:underline"
            >
              {personName}
            </Link>
            {" avaliou "}
            <span className="font-semibold">{gameName}</span>
          </>
        );
      case "game_added":
        return (
          <>
            <span className="font-semibold">{gameName}</span>
            {" foi adicionado à biblioteca"}
          </>
        );
      default:
        return "Atividade desconhecida";
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center">Carregando feed...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="w-8 h-8 text-purple-500" />
                Feed de Atividades
              </h1>
              <p className="text-muted-foreground mt-1">
                Veja o que está acontecendo na comunidade
              </p>
            </div>
          </div>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma atividade ainda</h3>
              <p className="text-muted-foreground text-center">
                Seja o primeiro a avaliar um jogo ou adicionar algo novo!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.activity_type)}
                      </div>

                      <div className="flex-grow min-w-0">
                        <p className="text-sm mb-2">
                          {getActivityText(activity)}
                        </p>

                        {activity.activity_type === "review" && (
                          <div className="flex items-center gap-3 mt-3">
                            {activity.metadata.game_cover && (
                              <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={activity.metadata.game_cover}
                                  alt={activity.metadata.game_name || ''}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  quality={75}
                                />
                              </div>
                            )}
                            <div className="flex-grow">
                              <StarRating
                                rating={activity.rating || 0}
                                onRatingChange={() => {}}
                                disabled
                                size={14}
                              />
                              {activity.metadata.comment && (
                                <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                                  "{activity.metadata.comment}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {activity.activity_type === "game_added" && (
                          <div className="flex items-center gap-3 mt-3">
                            {activity.metadata.game_cover && (
                              <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={activity.metadata.game_cover}
                                  alt={activity.metadata.game_name || ''}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  quality={75}
                                />
                              </div>
                            )}
                            {activity.metadata.genres && activity.metadata.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {activity.metadata.genres.slice(0, 3).map((genre: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 bg-muted rounded"
                                  >
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
