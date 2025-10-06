import { Skeleton } from "@/components/ui/skeleton";
import { GameCardSkeleton } from "./GameCardSkeleton";

export const HomePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black py-6 pt-1">
        <div className="w-full px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="px-4 -mt-10">
        <main className="bg-background rounded-2xl shadow-xl border border-border/50 p-4 min-h-screen">
          {/* Accordion header */}
          <div className="py-4 border-b">
            <Skeleton className="h-8 w-40" />
          </div>

          {/* Grid de cards */}
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
