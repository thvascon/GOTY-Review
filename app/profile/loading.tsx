export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 bg-muted animate-pulse" />
      <div className="container mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="h-8 bg-muted rounded w-48 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-card rounded-lg animate-pulse">
              <div className="w-32 h-32 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
