// src/app/public-catalog/page.tsx
import { Metadata } from 'next';
import PublicCatalogView from './PublicCatalogView';

export const metadata: Metadata = {
    title: 'Logo Catalog - Browse AI-Generated Logos',
    description: 'Explore our comprehensive collection of AI-generated logos',
};

export default function PublicCatalogPage() {
    return <PublicCatalogView />;
}