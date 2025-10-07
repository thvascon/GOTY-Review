import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const gameSchema = z.object({
  title: z.string().trim().min(1, { message: "O título não pode estar vazio" }),
  coverImage: z
    .string()
    .trim()
    .url({ message: "URL da imagem inválida" })
    .optional()
    .or(z.literal("")),
  sectionId: z.string().min(1, { message: "Selecione uma seção" }),
});

interface ApiGame {
  id: number;
  name: string;
  background_image: string;
  genres: { id: number; name: string }[];
}

interface Section {
  id: string;
  title: string;
}

interface AddGameDialogProps {
  onAddGame: (game: {
    title: string;
    coverImage?: string;
    sectionId: string;
    genres: string;
    rawgId?: number;
  }) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddGameDialog = ({
  onAddGame,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddGameDialogProps) => {
  const { profile } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    coverImage: "",
    sectionId: "",
    rawgId: undefined as number | undefined,
  });
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [selectedGameGenres, setSelectedGameGenres] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [sections, setSections] = useState<Section[]>([]);
  const [searchResults, setSearchResults] = useState<ApiGame[]>([]);
  const selectionMade = useRef(false);
  const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (!open || !profile?.group_id) return;
    const fetchSections = async () => {
      const { data, error } = await supabase
        .from("sections")
        .select("id, title")
        .eq("group_id", profile.group_id);
      if (error) {
        console.error("Erro ao buscar seções:", error);
        return;
      }
      setSections(data || []);
    };
    fetchSections();
  }, [open, profile]);

  useEffect(() => {
    if (selectionMade.current) {
      selectionMade.current = false;
      return;
    }

    if (formData.title.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    const debounceTimer = setTimeout(() => {
      const fetchGames = async () => {
        try {
          const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${formData.title}&page_size=5`;
          const response = await fetch(url);
          const data = await response.json();
          setSearchResults(data.results || []);
        } catch (error) {
          console.error("Erro ao buscar jogos:", error);
        }
      };
      fetchGames();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.title]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleGameSelect = async (game: ApiGame) => {
    selectionMade.current = true;

    const detailsUrl = `https://api.rawg.io/api/games/${game.id}?key=${API_KEY}`;
    try {
      const response = await fetch(detailsUrl);
      const detailsData = await response.json();

      const generosFormatados = (detailsData.genres || []).map(
        (g: { name: string }) => g.name
      );
      setSelectedGameGenres(generosFormatados);
      setFormData({
        ...formData,
        title: detailsData.name,
        coverImage: detailsData.background_image,
        rawgId: game.id,
      });
      setSearchResults([]);
    } catch (error) {
      console.error("Erro ao buscar detalhes do jogo:", error);
      setFormData({
        ...formData,
        title: game.name,
        coverImage: game.background_image,
        rawgId: game.id,
      });
      setSelectedGameGenres([]);
      setSearchResults([]);
    }
  };

  const validateForm = () => {
    try {
      gameSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !profile?.group_id) return;

    setIsCreatingSection(true);
    try {
      const { data, error } = await supabase
        .from("sections")
        .insert([{ title: newSectionName.trim(), group_id: profile.group_id }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar seção",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSections([...sections, data]);
      setFormData({ ...formData, sectionId: data.id });
      setNewSectionName("");
      toast({
        title: "Seção criada!",
        description: `"${data.title}" foi criada com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao criar seção:", error);
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAddGame({
        title: formData.title.trim(),
        coverImage: formData.coverImage.trim() || undefined,
        sectionId: formData.sectionId,
        genres: selectedGameGenres as any,
        rawgId: formData.rawgId,
      });
      toast({
        title: "Jogo adicionado!",
        description: `"${formData.title}" foi adicionado à lista de jogos.`,
        duration: 3000,
      });
      setFormData({ title: "", coverImage: "", sectionId: "", rawgId: undefined });
      setSelectedGameGenres([]);
      setErrors({});
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao adicionar jogo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!trigger && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button className="btn-glow flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Novo Jogo
          </Button>
        </DialogTrigger>
      )}
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Adicionar Novo Jogo</DialogTitle>
          <DialogDescription className="text-center">
            Digite um título, escolha a seção e adicione o jogo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 relative">
            <Label htmlFor="title">Título do Jogo *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Ex: The Last of Us Part II"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              autoComplete="off"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 shadow-lg">
                <ul className="max-h-60 overflow-y-auto">
                  {searchResults.map((game) => (
                    <li
                      key={game.id}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                      onClick={() => handleGameSelect(game)}
                    >
                      {game.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">URL da Capa</Label>
            <Input
              id="coverImage"
              type="url"
              placeholder="Preenchido automaticamente..."
              value={formData.coverImage}
              onChange={(e) => handleInputChange("coverImage", e.target.value)}
            />
            {errors.coverImage && (
              <p className="text-sm text-destructive">{errors.coverImage}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Seção *</Label>
            {sections.length > 0 ? (
              <Select
                value={formData.sectionId}
                onValueChange={(value) => handleInputChange("sectionId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma seção" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma seção criada ainda. Crie uma abaixo.</p>
            )}
            {errors.sectionId && (
              <p className="text-sm text-destructive">{errors.sectionId}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Nome da nova seção"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSection())}
              />
              <Button
                type="button"
                onClick={handleCreateSection}
                disabled={isCreatingSection || !newSectionName.trim()}
                size="sm"
              >
                {isCreatingSection ? "Criando..." : "+ Criar"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar Jogo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
