"use client";

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export interface SearchFilters {
  searchTerm: string;
  minRating: number;
  maxRating: number;
  genres: string[];
  status: string[];
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  availableGenres: string[];
}

const statusOptions = [
  { value: 'playing', label: 'Jogando' },
  { value: 'completed', label: 'Completado' },
  { value: 'dropped', label: 'Dropado' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'plan_to_play', label: 'Pretendo Jogar' },
];

const MAX_RATING = 5; // Sistema de 5 estrelas

export function AdvancedSearch({ onFiltersChange, availableGenres }: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(MAX_RATING);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const applyFilters = () => {
    onFiltersChange({
      searchTerm,
      minRating,
      maxRating,
      genres: selectedGenres,
      status: selectedStatus,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMinRating(0);
    setMaxRating(MAX_RATING);
    setSelectedGenres([]);
    setSelectedStatus([]);
    onFiltersChange({
      searchTerm: '',
      minRating: 0,
      maxRating: MAX_RATING,
      genres: [],
      status: [],
    });
  };

  const hasActiveFilters = minRating > 0 || maxRating < MAX_RATING || selectedGenres.length > 0 || selectedStatus.length > 0;
  const activeFilterCount = (minRating > 0 ? 1 : 0) + (maxRating < MAX_RATING ? 1 : 0) + selectedGenres.length + selectedStatus.length;

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge className="ml-2 px-1.5 min-w-[1.25rem] h-5" variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtros Avançados</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Faixa de Nota */}
              <div className="space-y-2">
                <Label>Faixa de Nota (Estrelas)</Label>
                <div className="flex items-center gap-2">
                  <Select value={minRating.toString()} onValueChange={(v) => setMinRating(parseInt(v))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: MAX_RATING + 1 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>{i}★</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">até</span>
                  <Select value={maxRating.toString()} onValueChange={(v) => setMaxRating(parseInt(v))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: MAX_RATING + 1 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>{i}★</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Gêneros */}
              {availableGenres.length > 0 && (
                <div className="space-y-2">
                  <Label>Gêneros</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map(genre => (
                      <Badge
                        key={genre}
                        variant={selectedGenres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <Badge
                      key={status.value}
                      variant={selectedStatus.includes(status.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(status.value)}
                    >
                      {status.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={() => { applyFilters(); setIsOpen(false); }} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {minRating > 0 && (
            <Badge variant="secondary">
              Nota mín: {minRating}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setMinRating(0); applyFilters(); }} />
            </Badge>
          )}
          {maxRating < MAX_RATING && (
            <Badge variant="secondary">
              Nota máx: {maxRating}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setMaxRating(MAX_RATING); applyFilters(); }} />
            </Badge>
          )}
          {selectedGenres.map(genre => (
            <Badge key={genre} variant="secondary">
              {genre}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { toggleGenre(genre); applyFilters(); }} />
            </Badge>
          ))}
          {selectedStatus.map(status => (
            <Badge key={status} variant="secondary">
              {statusOptions.find(s => s.value === status)?.label}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { toggleStatus(status); applyFilters(); }} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
