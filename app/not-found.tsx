export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          Voltar para Início
        </a>
      </div>
    </div>
  );
}
