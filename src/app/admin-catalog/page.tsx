// src/app/catalog/page.tsx
import { Metadata } from 'next';
import CatalogView from './CatalogView';

export const metadata: Metadata = {
    title: 'Logo Catalog',
    description: 'Browse the comprehensive logo catalog',
};

export default function CatalogPage() {
    return <CatalogView />;
}