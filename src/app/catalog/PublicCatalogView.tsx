// src/app/catalog/PublicCatalogView.tsx
'use client';

import SharedCatalogComponent from '../components/SharedCatalogComponent';

export default function PublicCatalogView() {
    return (
        <SharedCatalogComponent
            apiEndpoint="/api/catalog/public"
            title="Smarty Logos Catalog"
            defaultItemsPerPage={15}
            canRemoveLogos={false}
            hasHeader={false}  // No header on public catalog
        />
    );
}