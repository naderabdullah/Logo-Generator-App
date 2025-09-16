'use client';

import { useState, useEffect } from 'react';
import { TemplatePreviewProps } from '../../../types/businessCard';
import { generateBusinessCardPreview } from '../../lib/businessCardGenerator';

export const TemplatePreview = ({
                                    template,
                                    templateId,
                                    cardData,
                                    scale = 1
                                }: TemplatePreviewProps) => {

    // State for PDF preview
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use PDF previews for large scales (step 3) and when templateId is provided, HTML for small scales (step 2)
    const usePdfPreview = scale >= 0.8 && templateId;

    useEffect(() => {
        if (!template || !templateId || !usePdfPreview) return;

        const generatePreview = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const pdfDataUri = await generateBusinessCardPreview(templateId, cardData, scale);

                if (pdfDataUri) {
                    const base64Data = pdfDataUri.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);
                    setPdfBlobUrl(blobUrl);
                }
            } catch (err) {
                console.error('PDF preview generation failed:', err);
                setError('Preview generation failed');
            } finally {
                setIsLoading(false);
            }
        };

        generatePreview();

        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [template, templateId, cardData, scale, usePdfPreview]);

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                No template selected
            </div>
        );
    }

    // PDF Preview for large scales (step 3)
    if (usePdfPreview) {
        if (isLoading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 text-sm mt-2">Generating preview...</p>
                    </div>
                </div>
            );
        }

        if (error || !pdfBlobUrl) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                    {error || 'Preview unavailable'}
                </div>
            );
        }

        // Calculate dimensions that properly fit the container
        const aspectRatio = template.cardWidth / template.cardHeight;
        const MM_TO_PX = 3.7795;

        // Calculate the actual rendered size based on the scale and template dimensions
        const actualWidth = template.cardWidth * MM_TO_PX * scale;
        const actualHeight = template.cardHeight * MM_TO_PX * scale;

        return (
            <div className="w-full h-full flex items-center justify-center">
                <iframe
                    src={pdfBlobUrl}
                    style={{
                        width: `${actualWidth}px`,
                        height: `${actualHeight}px`,
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px'
                    }}
                    title="Business Card Preview"
                />
            </div>
        );
    }

    // HTML Preview for small scales (step 2)
    const mmToPixels = 4;
    const cardWidth = template.cardWidth * mmToPixels * scale;
    const cardHeight = template.cardHeight * mmToPixels * scale;

    return (
        <div
            className="relative bg-white border"
            style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                backgroundColor: template.globalStyles.backgroundColor || '#FFFFFF',
                borderColor: template.globalStyles.borderColor || '#E5E7EB',
                borderWidth: '1px'
            }}
        >
            {template.zones.map(zone => {
                const zoneX = zone.position.x * mmToPixels * scale;
                const zoneY = zone.position.y * mmToPixels * scale;
                const zoneWidth = zone.dimensions.width * mmToPixels * scale;
                const zoneHeight = zone.dimensions.height * mmToPixels * scale;
                const fontSize = Math.max(6, (zone.styles.fontSize || 10) * scale);

                return (
                    <div
                        key={zone.id}
                        className="absolute"
                        style={{
                            left: `${zoneX}px`,
                            top: `${zoneY}px`,
                            width: `${zoneWidth}px`,
                            height: `${zoneHeight}px`,
                            fontSize: `${fontSize}px`,
                            color: zone.styles.color || '#000000',
                            fontWeight: zone.styles.fontWeight || 'normal',
                            textAlign: zone.alignment,
                            lineHeight: zone.styles.lineHeight || 1.2,
                            fontFamily: 'helvetica, sans-serif',
                            overflow: 'hidden'
                        }}
                    >
                        {renderZoneContent(zone, cardData, fontSize)}
                    </div>
                );
            })}
        </div>
    );
};

// Zone content rendering for HTML preview
function renderZoneContent(zone: any, cardData: any, fontSize: number) {
    switch (zone.type) {
        case 'logo':
            if (cardData.logo.logoDataUri) {
                return (
                    <img
                        src={cardData.logo.logoDataUri}
                        alt="Logo"
                        style={{
                            width: '90%',
                            height: '90%',
                            objectFit: 'contain',
                            margin: '5%'
                        }}
                    />
                );
            }
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${fontSize * 0.6}px`,
                    color: '#9ca3af'
                }}>
                    Logo
                </div>
            );

        case 'company-name':
            return (
                <div style={{ paddingTop: `${fontSize * 0.7}px`, fontSize: `${fontSize}px` }}>
                    {cardData.companyName}
                </div>
            );

        case 'personal-info':
            return (
                <div style={{ fontSize: `${fontSize * 0.8}px`, lineHeight: 1.3 }}>
                    <div>{cardData.name}</div>
                    {cardData.title && <div>{cardData.title}</div>}
                    {cardData.emails[0]?.value && <div>{cardData.emails[0].value}</div>}
                    {cardData.phones[0]?.value && <div>{cardData.phones[0].value}</div>}
                    {cardData.websites[0]?.value && <div>{cardData.websites[0].value}</div>}
                </div>
            );

        case 'contact-info':
            return (
                <div style={{ fontSize: `${fontSize * 0.8}px`, lineHeight: 1.3 }}>
                    {cardData.emails[0]?.value && <div>{cardData.emails[0].value}</div>}
                    {cardData.phones[0]?.value && <div>{cardData.phones[0].value}</div>}
                    {cardData.websites[0]?.value && <div>{cardData.websites[0].value}</div>}
                </div>
            );

        case 'address':
            return (
                <div style={{ fontSize: `${fontSize * 0.8}px`, lineHeight: 1.3 }}>
                    {cardData.address && (
                        <>
                            {cardData.address.street && <div>{cardData.address.street}</div>}
                            {(cardData.address.city || cardData.address.state || cardData.address.zipCode) && (
                                <div>
                                    {[cardData.address.city, cardData.address.state, cardData.address.zipCode]
                                        .filter(Boolean)
                                        .join(', ')}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );

        default:
            return (
                <div style={{ fontSize: `${fontSize * 0.8}px` }}>
                    {zone.fieldMapping?.primary && cardData[zone.fieldMapping.primary]}
                </div>
            );
    }
}