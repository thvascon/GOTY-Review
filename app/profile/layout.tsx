import { Suspense } from 'react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>{children}</Suspense>;
}
