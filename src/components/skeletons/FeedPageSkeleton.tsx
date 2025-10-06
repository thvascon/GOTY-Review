import { Skeleton } from "@/components/ui/skeleton";

export const FeedPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>

        {/* Lista de atividades */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border rounded-lg p-4">
              <div className="flex gap-4">
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-1" />

                <div className="flex-grow space-y-3">
                  <Skeleton className="h-4 w-full max-w-md" />

                  <div className="flex items-center gap-3">
                    <Skeleton className="w-16 h-16 rounded" />
                    <div className="flex-grow space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>

                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
