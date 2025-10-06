import { Skeleton } from "@/components/ui/skeleton";

export const ProfilePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Banner e Avatar */}
      <div className="relative">
        <Skeleton className="w-full h-64 rounded-none" />
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
        </div>
      </div>

      {/* Nome e stats */}
      <div className="mt-20 text-center px-4">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <Skeleton className="h-6 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      </div>

      {/* Lista de avaliações */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Skeleton className="h-8 w-56 mb-6" />

        <Skeleton className="h-10 w-48 mb-6" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 p-4 bg-card border rounded-lg"
            >
              <Skeleton className="w-32 h-32 flex-shrink-0 rounded-md" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
