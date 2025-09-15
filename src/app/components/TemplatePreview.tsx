'use client';

import { TemplatePreviewProps } from '../../../types/businessCard';

export const TemplatePreview = ({
                                    template,
                                    cardData,
                                    scale = 1
                                }: TemplatePreviewProps) => {

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                No template selected
            </div>
        );
    }

    const cardWidth = template.cardWidth * scale * 4; // Convert mm to pixels (approximate)
    const cardHeight = template.cardHeight * scale * 4;

    return (
        <div
            className="relative bg-white border overflow-hidden"
            style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                backgroundColor: template.globalStyles.backgroundColor || '#FFFFFF',
                borderColor: template.globalStyles.borderColor || '#E5E7EB',
                borderWidth: template.globalStyles.borderWidth ? `${template.globalStyles.borderWidth * scale}px` : '1px',
                borderRadius: template.globalStyles.borderRadius ? `${template.globalStyles.borderRadius * scale}px` : '0px',
                padding: `${(template.globalStyles.padding || 0) * scale * 4}px`
            }}
        >
            {template.zones.map(zone => (
                <div
                    key={zone.id}
                    className="absolute"
                    style={{
                        left: `${zone.position.x * scale * 4}px`,
                        top: `${zone.position.y * scale * 4}px`,
                        width: `${zone.dimensions.width * scale * 4}px`,
                        height: `${zone.dimensions.height * scale * 4}px`,
                        fontSize: `${(zone.styles.fontSize || 10) * scale * 4}px`,
                        color: zone.styles.color || '#000000',
                        fontWeight: zone.styles.fontWeight || 'normal',
                        fontStyle: zone.styles.fontStyle || 'normal',
                        textAlign: zone.alignment,
                        lineHeight: zone.styles.lineHeight || 1.2,
                        textTransform: zone.styles.textTransform || 'none',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        overflow: 'hidden'
                    }}
                >
                    <ZoneContent zone={zone} cardData={cardData} scale={scale} />
                </div>
            ))}
        </div>
    );
};

// Helper component to render different zone types
const ZoneContent = ({ zone, cardData, scale }: {
    zone: any,
    cardData: any,
    scale: number
}) => {
    switch (zone.type) {
        case 'logo':
            if (cardData.logo.logoDataUri) {
                return (
                    <img
                        src={cardData.logo.logoDataUri}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                );
            }
            return (
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                    Logo
                </div>
            );

        case 'company-name':
            return (
                <div className="w-full h-full flex items-start">
                    <span className="truncate">{cardData.companyName || 'Company Name'}</span>
                </div>
            );

        case 'personal-info':
            return (
                <div className="w-full h-full flex flex-col justify-start space-y-1">
                    {cardData.name && (
                        <div className="truncate">{cardData.name}</div>
                    )}
                    {cardData.title && (
                        <div className="truncate text-sm opacity-80">{cardData.title}</div>
                    )}
                </div>
            );

        case 'contact-block':
            const contactLines = buildPreviewContactLines(zone.contactBlock, cardData);
            return (
                <div className="w-full h-full flex flex-col justify-start space-y-1 text-xs">
                    {contactLines.slice(0, zone.contactBlock?.maxLines || 6).map((line, index) => (
                        <div key={index} className="truncate">
                            {line}
                        </div>
                    ))}
                </div>
            );

        default:
            return null;
    }
};

// Helper function to build contact lines for preview
function buildPreviewContactLines(contactBlock: any, cardData: any): string[] {
    if (!contactBlock) return [];

    const lines: string[] = [];

    // Add phones
    if (contactBlock.fields.includes('phones') && cardData.phones.length > 0) {
        cardData.phones.forEach((phone: any) => {
            if (phone.value) {
                const line = phone.label ? `${phone.label}: ${phone.value}` : phone.value;
                lines.push(line);
            }
        });
    }

    // Add emails
    if (contactBlock.fields.includes('emails') && cardData.emails.length > 0) {
        const primaryEmail = cardData.emails.find((e: any) => e.isPrimary)?.value || cardData.emails[0].value;
        if (primaryEmail) {
            lines.push(primaryEmail);
        }
    }

    // Add websites
    if (contactBlock.fields.includes('websites') && cardData.websites.length > 0) {
        cardData.websites.forEach((site: any) => {
            if (site.value) {
                const cleanUrl = site.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
                lines.push(cleanUrl);
            }
        });
    }

    return lines;
}