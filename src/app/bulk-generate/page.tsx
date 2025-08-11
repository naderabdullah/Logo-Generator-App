// src/app/bulk-generate/page.tsx
import { Metadata } from 'next';
import BulkGenerateView from './BulkGenerateView';

export const metadata: Metadata = {
    title: 'Bulk Logo Generator',
    description: 'Bulk generate multiple logos for testing and development',
};

export default function BulkGeneratePage() {
    return <BulkGenerateView />;
}