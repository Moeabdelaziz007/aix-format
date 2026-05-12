import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AIX Interactive Trace · AIX Studio',
  description: 'Real-time neural reasoning and cryptographic trust chain visualization.',
};

export default function WowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
