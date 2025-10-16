import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoredGroup {
  id: string;
  name: string;
  invite_code: string;
  isActive: boolean;
  joinedAt: string;
}

const STORAGE_KEY = "user_groups";

export const useMultiGroups = (userId?: string) => {
  const [groups, setGroups] = useState<StoredGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar grupos do localStorage
  const loadGroups = () => {
    if (!userId) {
      setGroups([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGroups(parsed);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
      setGroups([]);
    }
  };

  // Salvar grupos no localStorage
  const saveGroups = (newGroups: StoredGroup[]) => {
    if (!userId) return;

    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newGroups));
      setGroups(newGroups);
    } catch (error) {
      console.error("Erro ao salvar grupos:", error);
    }
  };

  // Adicionar um novo grupo
  const addGroup = async (groupId: string) => {
    try {
      const { data: groupData, error } = await supabase
        .from("groups")
        .select("id, name, invite_code")
        .eq("id", groupId)
        .single();

      if (error || !groupData) {
        console.error("Erro ao buscar grupo:", error);
        return false;
      }

      // Verificar se já existe
      const existingIndex = groups.findIndex((g) => g.id === groupId);
      if (existingIndex >= 0) {
        // Se já existe, apenas marcar como ativo
        const updated = groups.map((g, i) => ({
          ...g,
          isActive: i === existingIndex,
        }));
        saveGroups(updated);
        return true;
      }

      // Adicionar novo grupo
      const newGroup: StoredGroup = {
        id: groupData.id,
        name: groupData.name,
        invite_code: groupData.invite_code,
        isActive: true, // Novo grupo sempre fica ativo
        joinedAt: new Date().toISOString(),
      };

      // Desativar outros grupos
      const updated = groups.map((g) => ({ ...g, isActive: false }));
      saveGroups([...updated, newGroup]);

      // Atualizar people table com o grupo ativo
      if (userId) {
        await supabase
          .from("people")
          .update({ group_id: groupId })
          .eq("user_id", userId);
      }

      return true;
    } catch (error) {
      console.error("Erro ao adicionar grupo:", error);
      return false;
    }
  };

  // Trocar grupo ativo
  const switchGroup = async (groupId: string) => {
    const updated = groups.map((g) => ({
      ...g,
      isActive: g.id === groupId,
    }));
    saveGroups(updated);

    // Atualizar people table
    if (userId) {
      await supabase
        .from("people")
        .update({ group_id: groupId })
        .eq("user_id", userId);
    }

    return true;
  };

  // Remover grupo
  const removeGroup = (groupId: string) => {
    const filtered = groups.filter((g) => g.id !== groupId);

    // Se removeu o grupo ativo, ativar o primeiro
    if (filtered.length > 0) {
      const activeExists = filtered.some((g) => g.isActive);
      if (!activeExists) {
        filtered[0].isActive = true;
      }
    }

    saveGroups(filtered);
  };

  // Inicializar com o grupo atual do profile
  const initializeFromProfile = async (profileGroupId: string) => {
    if (!userId || groups.length > 0) return;

    try {
      const { data: groupData } = await supabase
        .from("groups")
        .select("id, name, invite_code")
        .eq("id", profileGroupId)
        .single();

      if (groupData) {
        const initialGroup: StoredGroup = {
          id: groupData.id,
          name: groupData.name,
          invite_code: groupData.invite_code,
          isActive: true,
          joinedAt: new Date().toISOString(),
        };
        saveGroups([initialGroup]);
      }
    } catch (error) {
      console.error("Erro ao inicializar grupo:", error);
    }
  };

  // Obter grupo ativo
  const getActiveGroup = () => {
    return groups.find((g) => g.isActive);
  };

  useEffect(() => {
    if (userId) {
      loadGroups();
    }
    setLoading(false);
  }, [userId]);

  return {
    groups,
    loading,
    addGroup,
    switchGroup,
    removeGroup,
    initializeFromProfile,
    getActiveGroup,
  };
};
