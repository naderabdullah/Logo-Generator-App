// src/app/catalog/CatalogView.tsx
'use client';

import { useAuth } from '../context/AuthContext';
import SharedCatalogComponent from '../components/SharedCatalogComponent';

export default function CatalogView() {
    const { user } = useAuth();

    // Handle remove logo function
    const handleRemoveLogo = async (logoId: number) => {
        const res = await fetch(`/api/catalog/delete/${logoId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to remove from catalog');
        }
    };

    // Check authorization
    if (!user || !user.isSuperUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access the catalog.</p>
                </div>
            </div>
        );
    }

    return (
        <SharedCatalogComponent
            apiEndpoint="/api/catalog"
            title="Admin Logo Catalog"
            defaultItemsPerPage={30}
            canRemoveLogos={true}
            onRemoveLogo={handleRemoveLogo}
        />
    );
}