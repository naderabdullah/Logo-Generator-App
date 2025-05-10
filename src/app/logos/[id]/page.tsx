import { Metadata } from 'next';
import LogoViewClient from './LogoView';

export const metadata: Metadata = {
  title: 'Logo Details',
  description: 'View your generated logo details',
};

// In Next.js 15, params is now a Promise that must be awaited
export default async function LogoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <LogoViewClient logoId={id} />;
}