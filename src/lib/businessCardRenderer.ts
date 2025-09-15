import jsPDF from 'jspdf';
import { BusinessCardTemplate, BusinessCardData, BusinessCardZone, ContactField } from '../../types/businessCard';

export class BusinessCardRenderer {
    private doc: jsPDF;

    constructor(doc: jsPDF) {
        this.doc = doc;
    }

    /**
     * Render a complete business card at specified position
     */
    async renderCard(
        template: BusinessCardTemplate,
        cardData: BusinessCardData,
        cardX: number,
        cardY: number
    ): Promise<void> {
        try {
            console.log('🎴 Rendering business card at:', { cardX, cardY });

            // Render card background and borders first
            this.renderCardBackground(template, cardX, cardY);

            // Process each zone in order
            for (const zone of template.zones) {
                await this.renderZone(zone, cardData, cardX, cardY);
            }

            console.log('✅ Business card rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering business card:', error);
            throw error;
        }
    }

    /**
     * Render card background, borders, and global styling
     */
    private renderCardBackground(template: BusinessCardTemplate, cardX: number, cardY: number): void {
        const { cardWidth, cardHeight, globalStyles } = template;

        // Fill background color if specified
        if (globalStyles.backgroundColor) {
            this.doc.setFillColor(globalStyles.backgroundColor);
            this.doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
        }

        // Draw border if specified
        if (globalStyles.borderColor && globalStyles.borderWidth) {
            this.doc.setDrawColor(globalStyles.borderColor);
            this.doc.setLineWidth(globalStyles.borderWidth);
            this.doc.rect(cardX, cardY, cardWidth, cardHeight, 'S');
        }
    }

    /**
     * Render individual zone based on its type
     */


    private renderSimpleText(zone: BusinessCardZone, text: string, x: number, y: number): void {
        if (!text) {
            console.log(`📝 No text to render for zone: ${zone.id}`);
            return;
        }

        console.log(`📝 Rendering text: "${text}" at (${x}, ${y})`);

        // Set font and size
        const fontSize = zone.styles.fontSize || 10;
        this.doc.setFontSize(fontSize);

        // Set font weight
        const fontWeight = zone.styles.fontWeight === 'bold' ? 'bold' : 'normal';
        this.doc.setFont('helvetica', fontWeight);

        // Set color
        if (zone.styles.color) {
            const hex = zone.styles.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            this.doc.setTextColor(r, g, b);
        } else {
            this.doc.setTextColor(0, 0, 0); // Default to black
        }

        // Render text
        this.doc.text(text, x, y + fontSize * 0.7, {
            align: zone.alignment as any,
            maxWidth: zone.dimensions.width
        });
    }

    /**
     * Render logo with proper sizing and aspect ratio handling
     */
    private async renderZone(
        zone: BusinessCardZone,
        cardData: BusinessCardData,
        cardX: number,
        cardY: number
    ): Promise<void> {
        const zoneX = cardX + zone.position.x;
        const zoneY = cardY + zone.position.y;

        console.log(`🎯 Rendering zone: ${zone.type} at (${zoneX}, ${zoneY})`);

        switch (zone.type) {
            case 'logo':
                await this.renderLogo(zone, cardData, zoneX, zoneY);
                break;
            case 'company-name':
                this.renderSimpleText(zone, cardData.companyName, zoneX, zoneY);
                break;
            case 'personal-info':
                this.renderSimpleText(zone, cardData.name, zoneX, zoneY);
                break;
            case 'title-info':
                this.renderSimpleText(zone, cardData.title, zoneX, zoneY);
                break;
            case 'contact-block':
                this.renderContactBlock(zone, cardData, zoneX, zoneY);
                break;
            default:
                console.warn(`Unknown zone type: ${zone.type}`);
        }
    }

    private async renderLogo(
        zone: BusinessCardZone,
        cardData: BusinessCardData,
        x: number,
        y: number
    ): Promise<void> {
        console.log('🎨 renderLogo called');

        try {
            const logoData = await this.getLogoData(cardData.logo);

            if (!logoData) {
                console.warn('⚠️ No logo data available, rendering placeholder');
                this.renderLogoPlaceholder(zone, x, y);
                return;
            }

            console.log('✅ Logo data found, rendering image...');

            const { width, height } = zone.dimensions;
            const paddingFactor = 0.9;
            const renderWidth = width * paddingFactor;
            const renderHeight = height * paddingFactor;
            const centerX = x + (width - renderWidth) / 2;
            const centerY = y + (height - renderHeight) / 2;

            this.doc.addImage(logoData, 'PNG', centerX, centerY, renderWidth, renderHeight);
            console.log('✅ Logo rendered successfully');

        } catch (error) {
            console.error('❌ Error rendering logo:', error);
            this.renderLogoPlaceholder(zone, x, y);
        }
    }

    private renderLogoPlaceholder(zone: BusinessCardZone, x: number, y: number): void {
        console.log('🔲 Rendering logo placeholder');

        // Draw a border rectangle
        this.doc.setDrawColor('#CCCCCC');
        this.doc.setLineWidth(0.5);
        this.doc.rect(x, y, zone.dimensions.width, zone.dimensions.height, 'S');

        // Add placeholder text
        this.doc.setFontSize(8);
        this.doc.setTextColor('#999999');
        this.doc.text('LOGO', x + zone.dimensions.width/2, y + zone.dimensions.height/2, {
            align: 'center'
        });
    }


    /**
     * Get logo data from various sources (existing system integration)
     */
    private async getLogoData(logoInfo: BusinessCardData['logo']): Promise<string | null> {
        console.log('🔍 getLogoData called with:', {
            hasLogoDataUri: !!logoInfo.logoDataUri,
            logoDataLength: logoInfo.logoDataUri?.length,
            logoId: logoInfo.logoId
        });

        // Since we're now passing complete data from HistoryView, just use it directly
        if (logoInfo.logoDataUri) {
            if (logoInfo.logoDataUri.startsWith('data:image/')) {
                console.log('✅ Using logo data from client');
                return logoInfo.logoDataUri;
            } else {
                console.warn('⚠️ Invalid logo data URI format');
            }
        } else {
            console.warn('⚠️ No logo data provided from client');
        }

        return null;
    }
    /**
     * Get image aspect ratio from data URI
     */
    private async getImageAspectRatio(dataUri: string): Promise<number | null> {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    resolve(aspectRatio);
                };
                img.onerror = () => {
                    console.warn('Could not load image for aspect ratio calculation');
                    resolve(null);
                };
                img.src = dataUri;
            } catch (error) {
                console.error('Error calculating aspect ratio:', error);
                resolve(null);
            }
        });
    }
    /**
     * Render simple text with styling
     */
    private renderText(zone: BusinessCardZone, text: string, x: number, y: number): void {
        if (!text) return;

        this.applyTextStyles(zone.styles);

        const fontSize = zone.styles.fontSize || 10;
        const textY = y + (fontSize * 0.35); // Adjust for baseline

        this.doc.text(text, x, textY, {
            align: zone.alignment as any,
            maxWidth: zone.dimensions.width
        });
    }

    /**
     * Render personal information (name + title)
     */
    private renderPersonalInfo(zone: BusinessCardZone, cardData: BusinessCardData, x: number, y: number): void {
        let currentY = y;
        const lineHeight = zone.styles.fontSize || 9;
        const lineSpacing = (lineHeight * (zone.styles.lineHeight || 1.4));

        this.applyTextStyles(zone.styles);

        if (cardData.name) {
            // Name in bold
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(cardData.name, x, currentY + lineHeight * 0.7, {
                align: zone.alignment as any,
                maxWidth: zone.dimensions.width
            });
            currentY += lineSpacing;
        }

        if (cardData.title) {
            // Title in normal weight
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(cardData.title, x, currentY + lineHeight * 0.7, {
                align: zone.alignment as any,
                maxWidth: zone.dimensions.width
            });
        }
    }

    /**
     * Render contact information block with smart formatting
     */
    private renderContactBlock(zone: BusinessCardZone, cardData: BusinessCardData, x: number, y: number): void {
        console.log('📞 Rendering contact block');

        const contactLines: string[] = [];

        // Add phone numbers
        cardData.phones.forEach(phone => {
            if (phone.value) {
                contactLines.push(`${phone.label || 'Phone'}: ${phone.value}`);
            }
        });

        // Add emails
        cardData.emails.forEach(email => {
            if (email.value) {
                contactLines.push(email.value);
            }
        });

        // Add websites
        cardData.websites.forEach(website => {
            if (website.value) {
                const cleanUrl = website.value.replace(/^https?:\/\//, '');
                contactLines.push(cleanUrl);
            }
        });

        console.log('📞 Contact lines:', contactLines);

        if (contactLines.length === 0) return;

        // Set font style
        const fontSize = zone.styles.fontSize || 8;
        this.doc.setFontSize(fontSize);
        this.doc.setFont('helvetica', 'normal');

        if (zone.styles.color) {
            const hex = zone.styles.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            this.doc.setTextColor(r, g, b);
        } else {
            this.doc.setTextColor(0, 0, 0); // Default to black
        }

        // Render each line with spacing
        const lineHeight = fontSize * (zone.styles.lineHeight || 1.8);
        let currentY = y;

        contactLines.forEach((line, index) => {
            if (currentY + fontSize <= y + zone.dimensions.height) {
                this.doc.text(line, x, currentY + fontSize * 0.7, {
                    align: zone.alignment as any,
                    maxWidth: zone.dimensions.width
                });
                currentY += lineHeight;
            }
        });
    }


    /**
     * Build formatted contact information lines
     */
    private buildContactLines(contactBlock: any, cardData: BusinessCardData): string[] {
        const lines: string[] = [];

        // Add phone numbers with smart formatting
        if (contactBlock.fields.includes('phones') && cardData.phones.length > 0) {
            cardData.phones.forEach(phone => {
                if (phone.value) {
                    const formattedPhone = this.formatPhoneNumber(phone.value);
                    const line = phone.label ? `${phone.label}: ${formattedPhone}` : formattedPhone;
                    lines.push(line);
                }
            });
        }

        // Add email addresses
        if (contactBlock.fields.includes('emails') && cardData.emails.length > 0) {
            const primaryEmail = cardData.emails.find(e => e.isPrimary)?.value || cardData.emails[0].value;
            if (primaryEmail) {
                lines.push(primaryEmail);
            }
        }

        // Add websites with clean formatting
        if (contactBlock.fields.includes('websites') && cardData.websites.length > 0) {
            cardData.websites.forEach(site => {
                if (site.value) {
                    const cleanUrl = site.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    lines.push(cleanUrl);
                }
            });
        }

        // Add social media
        if (contactBlock.fields.includes('social') && cardData.socialMedia.length > 0) {
            const socialLines = cardData.socialMedia
                .slice(0, 2) // Limit to prevent overcrowding
                .map(social => `${social.platform}: ${social.handle}`)
                .join(' | ');
            if (socialLines) lines.push(socialLines);
        }

        return lines;
    }

    /**
     * Apply text styling to PDF context
     */
    private applyTextStyles(styles: any): void {
        if (styles.fontSize) {
            this.doc.setFontSize(styles.fontSize);
        }

        if (styles.color) {
            // Convert hex color to RGB
            const hex = styles.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            this.doc.setTextColor(r, g, b);
        }

        const fontWeight = styles.fontWeight || 'normal';
        const fontStyle = styles.fontStyle || 'normal';

        let fontName = 'helvetica';
        if (fontStyle === 'italic' && fontWeight === 'bold') {
            fontName = 'helvetica-boldoblique';
        } else if (fontStyle === 'italic') {
            fontName = 'helvetica-oblique';
        } else if (fontWeight === 'bold') {
            fontName = 'helvetica-bold';
        }

        this.doc.setFont('helvetica', fontWeight === 'bold' ? 'bold' : 'normal');
    }

    /**
     * Format phone number consistently
     */
    private formatPhoneNumber(phone: string): string {
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 11 && cleaned[0] === '1') {
            return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
        }

        return phone; // Return original if formatting fails
    }
}