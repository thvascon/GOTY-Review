"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function ProfileRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading } = useAuth();
  const id = searchParams.get("id");

  useEffect(() => {
    // Se não tem ID na URL e o usuário está logado, redireciona para o próprio perfil
    if (!loading && !id && profile?.id) {
      router.replace(`/profile?id=${profile.id}`);
    }
  }, [id, profile, loading, router]);

  return null;
}
