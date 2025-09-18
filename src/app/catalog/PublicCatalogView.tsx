// src/app/public-catalog/PublicCatalogView.tsx
'use client';

import SharedCatalogComponent from '../components/SharedCatalogComponent';

export default function PublicCatalogView() {
    return (
        <SharedCatalogComponent
            apiEndpoint="/api/catalog/public"
            title="Smarty Logos Catalog"
            defaultItemsPerPage={15}
            canRemoveLogos={false}
        />
    );
}