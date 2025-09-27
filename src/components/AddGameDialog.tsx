// Arquivo: AddGameDialog.tsx (versão final com API)

import { useState, useEffect } from "react"; // Adicionamos o useEffect
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Schema de validação (sem mudanças)
const gameSchema = z.object({
  title: z.string().trim().min(1, { message: "O título não pode estar vazio" }),
  coverImage: z
    .string()
    .trim()
    .url({ message: "URL da imagem inválida" })
    .optional()
    .or(z.literal("")),
});

// NOVO: Criamos uma interface para os dados que vêm da API da RAWG
interface ApiGame {
  id: number;
  name: string;
  background_image: string;
}

interface AddGameDialogProps {
  onAddGame: (game: { title: string; coverImage?: string }) => void;
  trigger?: React.ReactNode;
}

export const AddGameDialog = ({ onAddGame, trigger }: AddGameDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", coverImage: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // NOVO: Estado para guardar os resultados da busca da API
  const [searchResults, setSearchResults] = useState<ApiGame[]>([]);

  // COLOQUE SUA CHAVE DA RAWG.IO AQUI
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

  // NOVO: Lógica que busca na API sempre que o título (formData.title) muda
  useEffect(() => {
    // Só busca se o usuário digitou pelo menos 3 caracteres
    if (formData.title.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    // Timer para não fazer uma chamada a cada tecla pressionada (debounce)
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
    }, 500); // Espera 500ms após o usuário parar de digitar

    // Limpa o timer se o usuário continuar digitando
    return () => clearTimeout(debounceTimer);
  }, [formData.title]); // Esta é a "dependência": roda a lógica sempre que o título mudar

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // NOVO: Função chamada quando o usuário clica em um jogo da lista de sugestões
  const handleGameSelect = (game: ApiGame) => {
    // Preenche automaticamente o título e a URL da capa no formulário
    setFormData({
      title: game.name,
      coverImage: game.background_image,
    });
    // Esconde a lista de resultados
    setSearchResults([]);
  };

  // Funções de validação e submit (sem mudanças)
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onAddGame({
        title: formData.title.trim(),
        coverImage: formData.coverImage.trim() || undefined
      });
      
      toast({
        title: "Jogo adicionado!",
        description: `"${formData.title}" foi adicionado à lista de jogos.`,
        duration: 3000
      });
      
      // Reset form and close dialog
      setFormData({ title: '', coverImage: '' });
      setErrors({});
      setOpen(false);
      
    } catch (error) {
      toast({
        title: "Erro ao adicionar jogo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

return (
  <Dialog open={open} onOpenChange={setOpen}>
    {/* Alinha o botão com outros elementos na mesma linha */}
    <div className="flex items-center gap-x-2">
      <DialogTrigger asChild>
        <Button className="btn-glow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Novo Jogo
        </Button>
      </DialogTrigger>
      {/* Adicione outros botões ou filtros aqui, se houver */}
    </div>
    <DialogContent className="sm:max-w-md mx-auto">
      <DialogHeader>
        <DialogTitle className="text-center">Adicionar Novo Jogo</DialogTitle>
        <DialogDescription className="text-center">
          Digite um título para buscar e adicionar um novo jogo.
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
          <Label htmlFor="coverImage">URL da Capa (automático)</Label>
          <Input
            id="coverImage"
            type="url"
            placeholder="Preenchido automaticamente após a busca..."
            value={formData.coverImage}
            onChange={(e) => handleInputChange("coverImage", e.target.value)}
          />
          {errors.coverImage && (
            <p className="text-sm text-destructive">{errors.coverImage}</p>
          )}
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
