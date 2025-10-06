import { Skeleton } from "@/components/ui/skeleton";

export const GameCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden flex flex-col">
      {/* Imagem da capa */}
      <Skeleton className="w-full h-48" />

      <div className="p-4 flex flex-col flex-grow">
        {/* Gêneros */}
        <div className="flex gap-1.5 mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>

        {/* Sua avaliação */}
        <div className="mb-4 pb-3 border-b border-border">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Avaliações de outros jogadores */}
        <div className="space-y-2 mb-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* Média da galera */}
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};
