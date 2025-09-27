import { useState } from 'react';
import { Plus, User, X } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Validation schema
const personSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "O nome não pode estar vazio" })
    .max(50, { message: "O nome deve ter menos de 50 caracteres" })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, { message: "O nome deve conter apenas letras e espaços" })
});

interface AddPersonDialogProps {
  onAddPerson: (person: { name: string }) => void;
  existingNames: string[];
  trigger?: React.ReactNode;
}

export const AddPersonDialog = ({ onAddPerson, existingNames, trigger }: AddPersonDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      personSchema.parse(formData);
      
      // Check for duplicate names (case insensitive)
      const normalizedName = formData.name.trim().toLowerCase();
      const isDuplicate = existingNames.some(name => 
        name.toLowerCase() === normalizedName
      );
      
      if (isDuplicate) {
        setErrors({ name: "Esta pessoa já está na lista" });
        return false;
      }
      
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
      
      onAddPerson({
        name: formData.name.trim()
      });
      
      toast({
        title: "Pessoa adicionada!",
        description: `${formData.name} foi adicionado(a) ao grupo.`,
        duration: 3000
      });
      
      // Reset form and close dialog
      setFormData({ name: '' });
      setErrors({});
      setOpen(false);
      
    } catch (error) {
      toast({
        title: "Erro ao adicionar pessoa",
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
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="flex items-center gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
          >
            <Plus className="w-4 h-4" />
            Adicionar Nova Pessoa
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <User className="w-4 h-4 text-secondary-foreground" />
            </div>
            Adicionar Nova Pessoa
          </DialogTitle>
          <DialogDescription>
            Adicione um novo amigo ao grupo para que ele possa avaliar jogos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: João"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(errors.name && "border-destructive focus:border-destructive")}
              maxLength={50}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
            
            {existingNames.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span>Pessoas já adicionadas: </span>
                <span className="font-medium">{existingNames.join(', ')}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-transparent border-t-current mr-2" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pessoa
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};