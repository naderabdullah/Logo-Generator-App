// src/app/admin-business-cards/page.tsx
import { Metadata } from 'next';
import BusinessCardAdmin from './BusinessCardAdmin';

export const metadata: Metadata = {
    title: 'Business Card Layouts - Admin',
    description: 'View and manage business card layout catalog',
};

/**
 * Admin Business Cards Page
 * File: src/app/admin-business-cards/page.tsx
 *
 * Admin-only page for viewing the business card layout catalog.
 * Displays all 100 pre-generated business card layouts in a paginated grid.
 */
export default function AdminBusinessCardsPage() {
    console.log('🎯 Loading Admin Business Cards page');

    return <BusinessCardAdmin />;
}