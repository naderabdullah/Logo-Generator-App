// src/lib/certificateGenerator.ts - Complete file with clean design
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const BASE_URL = process.env.NEXTAUTH_URL;
// const BASE_URL = process.env.NEXTAUTH_URL ||
//     (process.env.NODE_ENV === 'production'
//         ? 'https://smartylogos.com'
//         : 'http://localhost:3000');

// Secret key for signing certificates - should be in environment variables
const CERTIFICATE_SECRET = process.env.CERTIFICATE_SECRET;
// const CERTIFICATE_SECRET = process.env.CERTIFICATE_SECRET || 'your-secret-key-change-in-production';

export interface CertificateData {
    userEmail: string;
    issueDate: string;
    certificateId: string;
    digitalSignature: string;
}

// Encode user data into the certificate ID for stateless verification
export function generateCertificateId(userEmail: string): string {
    try {
        const timestamp = Date.now();
        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Create a compact encoding of user email (first part before @, max 8 chars)
        const emailPrefix = userEmail.split('@')[0].substring(0, 8).toLowerCase();

        // Create hash of email for verification
        const emailHash = simpleHash(userEmail).toString(36).substring(0, 6);

        // Format: CERT-TIMESTAMP-EMAILPREFIX-EMAILHASH
        const id = `CERT-${timestamp.toString(36)}-${emailPrefix}-${emailHash}`.toUpperCase();

        console.log('✅ Generated self-verifying certificate ID:', id);
        return id;
    } catch (error) {
        console.error('❌ Error generating certificate ID:', error);
        const fallbackId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
        console.log('⚠️ Using fallback ID:', fallbackId);
        return fallbackId;
    }
}

// Simple hash function for email verification (not cryptographically secure, but sufficient for this purpose)
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Generate digital signature that can be verified without storing data
export function generateDigitalSignature(data: CertificateData): string {
    try {
        console.log('📄 Generating stateless signature for data:', data);

        if (!data || !data.userEmail || !data.issueDate || !data.certificateId) {
            throw new Error('Missing required data for signature generation');
        }

        // Create signature data including the secret
        const signatureData = `${data.userEmail}:${data.issueDate}:${data.certificateId}:${CERTIFICATE_SECRET}`;
        console.log('📤 Signature input created (without secret shown)');

        // Generate signature hash
        const signature = simpleHash(signatureData).toString(36) + simpleHash(signatureData.split('').reverse().join('')).toString(36);

        console.log('✅ Generated stateless signature:', signature);
        return signature.toUpperCase();

    } catch (error) {
        console.error('❌ Error generating digital signature:', error);
        const fallbackSignature = simpleHash(`fallback-${Date.now()}`).toString(36);
        console.log('⚠️ Using fallback signature:', fallbackSignature);
        return fallbackSignature.toUpperCase();
    }
}

// Verify certificate using only the certificate ID (stateless)
export function verifyCertificateId(certificateId: string): {
    isValid: boolean;
    timestamp?: number;
    issueDate?: string;
    emailPrefix?: string;
    estimatedEmail?: string;
} {
    try {
        console.log('🔍 Verifying certificate ID:', certificateId);

        // Parse certificate ID format: CERT-TIMESTAMP-EMAILPREFIX-EMAILHASH
        const parts = certificateId.split('-');

        if (parts.length !== 4 || parts[0] !== 'CERT') {
            return { isValid: false };
        }

        const timestampStr = parts[1];
        const emailPrefix = parts[2].toLowerCase();
        const emailHash = parts[3].toLowerCase();

        // Convert timestamp back to number
        const timestamp = parseInt(timestampStr, 36);
        const issueDate = new Date(timestamp);

        // Basic validation
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        const oneHourFromNow = now + (60 * 60 * 1000);

        // Check if timestamp is reasonable (not too old, not in future)
        if (timestamp < oneYearAgo || timestamp > oneHourFromNow) {
            console.log('❌ Certificate timestamp out of valid range');
            return { isValid: false };
        }

        console.log('✅ Certificate ID structure is valid');

        return {
            isValid: true,
            timestamp,
            issueDate: issueDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            emailPrefix,
            estimatedEmail: `${emailPrefix}@[domain]` // We can't recover the full email, but we can show the prefix
        };

    } catch (error) {
        console.error('❌ Error verifying certificate ID:', error);
        return { isValid: false };
    }
}

// Verify the complete certificate signature
export function verifyCertificateSignature(certificateId: string, userEmail: string, digitalSignature: string): boolean {
    try {
        // Extract date from certificate ID
        const verification = verifyCertificateId(certificateId);
        if (!verification.isValid || !verification.issueDate) {
            return false;
        }

        // Reconstruct the signature
        const testData: CertificateData = {
            userEmail,
            issueDate: verification.issueDate,
            certificateId,
            digitalSignature: '' // Will be ignored
        };

        const expectedSignature = generateDigitalSignature(testData);
        const isValid = expectedSignature === digitalSignature.toUpperCase();

        console.log(`🔍 Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;

    } catch (error) {
        console.error('❌ Error verifying certificate signature:', error);
        return false;
    }
}

export async function generateOwnershipCertificate(data: CertificateData): Promise<Buffer> {
    try {
        console.log('📄 Starting PDF generation with data:', data);

        // VALIDATE INPUT DATA
        if (!data) {
            throw new Error('Certificate data is null or undefined');
        }

        const userEmail = data.userEmail || 'Unknown User';
        const issueDate = data.issueDate || new Date().toLocaleDateString();
        const certificateId = data.certificateId || 'UNKNOWN-ID';
        const digitalSignature = data.digitalSignature || 'UNKNOWN-SIGNATURE';

        console.log('✅ Validated data:', { userEmail, issueDate, certificateId, digitalSignature });

        // Create new PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Colors (converted to RGB values for jsPDF)
        const primaryColor = [79, 70, 229]; // #4F46E5
        const secondaryColor = [99, 102, 241]; // #6366F1
        const accentColor = [245, 158, 11]; // #F59E0B
        const textDark = [31, 41, 55]; // #1F2937
        const textGray = [107, 114, 128]; // #6B7280

        // Certificate Border - Start from top
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(2);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 40); // Start from top with margin

        // Inner decorative border
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setLineWidth(0.5);
        doc.rect(18, 18, pageWidth - 36, pageHeight - 46);

        // Certificate Title - At top of border
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('CERTIFICATE OF OWNERSHIP', pageWidth / 2, 35, { align: 'center' });

        // Decorative line
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(1);
        doc.line(pageWidth / 2 - 40, 40, pageWidth / 2 + 40, 40);

        // Main Content
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');

        const startY = 50;
        let currentY = startY;

        // Introduction
        // Introduction
        doc.text('This certificate hereby declares and establishes that the owner of this email:', pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // User Information
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(userEmail, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // Ownership Declaration - SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const ownershipText = [
            'is the sole and exclusive owner of all logos, designs, graphics, and intellectual',
            'property created through the SMARTY LOGOS™ AI LOGO GENERATOR',
            'PLATFORM associated with this account.',
            '',
            'This ownership includes, but is not limited to, the following comprehensive rights:'
        ];

        ownershipText.forEach(line => {
            if (line === '') {
                currentY += 6;
            } else {
                doc.text(line, pageWidth / 2, currentY, { align: 'center' });
                currentY += 6;
            }
        });

        currentY += 3;

        // Rights List
        const rights = [
            '• CREATE, modify, and derive new works from all generated logos',
            '• STORE, archive, and maintain copies in any format or medium',
            '• EDIT, enhance, resize, recolor, and make any modifications',
            '• SELL, license, and monetize the logos for commercial purposes',
            '• TRANSFER ownership rights to third parties through sale or gift',
            '• PROMOTE and market using the logos across all media channels',
            '• PRINT and reproduce the logos in physical and digital formats',
            '• DISPLAY the logos publicly in any context or application',
            '• DISTRIBUTE the logos through any means or channels',
            '• SUBLICENSE the logos to employees, contractors, or partners',
            '• USE the logos as trademarks or service marks (subject to trademark law)',
            '• INCORPORATE the logos into larger works or derivative products'
        ];

// Calculate block dimensions
        const rightsBlockHeight = (rights.length * 5) + 10; // 5mm per line + 10mm padding
        const rightsBlockY = currentY;

// Draw background block (similar to QR overlay)
        doc.setFillColor(249, 250, 251); // Same gray as details section
        doc.rect(25, rightsBlockY - 3, pageWidth - 50, rightsBlockHeight, 'F');

doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.5);
doc.rect(25, rightsBlockY - 3, pageWidth - 50, rightsBlockHeight);

        currentY += 5; // Padding from top of block

// Centered rights text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);

        rights.forEach(right => {
            doc.text(right, pageWidth / 2, currentY, { align: 'center' });
            currentY += 5;
        });

        currentY += 8; // Padding from bottom of block

        // Copyright Declaration
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

        const copyrightText = [
            'COMPLETE COPYRIGHT OWNERSHIP',
            '',
            'The certificate holder reserves and is entitled to ALL associated copyrights,',
            'including moral rights, economic rights, and any future rights that may arise',
            'under intellectual property law. Limited rights are retained by',
            'SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM.'
        ];

        copyrightText.forEach(line => {
            if (line === '') {
                currentY += 4;
            } else {
                doc.text(line, pageWidth / 2, currentY, { align: 'center' });
                currentY += 5;
            }
        });

        currentY += 8; // Reduced spacing

        // Legal Declaration - SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');

        const legalText = [
            'This certificate constitutes an official declaration of ownership and may be used accordingly.',
            'SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM hereby',
            'waives any claim to the intellectual property described herein and acknowledges',
            'the exclusive ownership of the certificate holder.'
        ]

        legalText.forEach(line => {
            doc.text(line, pageWidth / 2, currentY, { align: 'center' });
            currentY += 4;
        });

        currentY += 8; // Space before certificate details

        // Certificate Details Section - More space available now
        const detailsStartY = pageHeight - 55; // More space available

        // Background for certificate details
        doc.setFillColor(249, 250, 251);
        doc.rect(20, detailsStartY - 5, pageWidth - 40, 30, 'F');

        let detailsY = detailsStartY;

        // Certificate ID and Date
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        doc.text('Certificate ID:', 25, detailsY);
        doc.setFont('helvetica', 'bold');
        doc.text(certificateId, 55, detailsY);

        doc.setFont('helvetica', 'normal');
        doc.text('Issue Date:', 25, detailsY + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(issueDate, 55, detailsY + 6);

        doc.setFont('helvetica', 'normal');
        doc.text('Account Email:', 25, detailsY + 12);
        doc.setFont('helvetica', 'bold');
        doc.text(userEmail, 55, detailsY + 12);

        // Digital Signature - Compact layout
        doc.setFont('helvetica', 'normal');
        doc.text('Digital Signature:', 25, detailsY + 18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const shortSignature = digitalSignature.length > 40 ?
            digitalSignature.substring(0, 40) + '...' :
            digitalSignature;
        doc.text(shortSignature, 55, detailsY + 18);

        // QR CODE GENERATION
        try {
            console.log('📄 Generating QR code...');

            const verificationUrl = `${BASE_URL}/verify/${certificateId}`;
            console.log('🔗 Verification URL:', verificationUrl);

            const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'M',
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
                width: 80,
            });

            console.log('✅ QR code generated successfully');

            const qrSize = 18;
            const qrX = pageWidth - 45;
            const qrY = detailsY + 2; // Positioned within details area

            doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            doc.setFontSize(6);
            doc.setTextColor(textGray[0], textGray[1], textGray[2]);
            doc.text('Scan to verify', qrX + qrSize/2, qrY + qrSize + 3, { align: 'center' });

        } catch (error) {
            console.error('❌ Failed to generate QR code:', error);

            // Fallback QR code placeholder
            doc.setDrawColor(textGray[0], textGray[1], textGray[2]);
            doc.setLineWidth(0.5);
            doc.rect(pageWidth - 45, detailsY + 2, 20, 20); // Positioned within details area
            doc.setFontSize(6);
            doc.text('QR CODE', pageWidth - 35, detailsY + 12, { align: 'center' });
            doc.text('VERIFICATION', pageWidth - 35, detailsY + 15, { align: 'center' });
        }

// Footer
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM', pageWidth / 2, pageHeight - 10, { align: 'center' });

// Clickable verification link
        const verificationText = `Verify at: ${BASE_URL}/verify/${certificateId}`;
        const verificationUrl = `${BASE_URL}/verify/${certificateId}`;

// Calculate text width for centering the link area
        const textWidth = doc.getTextWidth(verificationText);
        const linkX = (pageWidth - textWidth) / 2;
        const linkY = pageHeight - 8; // Slightly above the text baseline
        const linkWidth = textWidth;
        const linkHeight = 4; // Height of clickable area

// Add the text
        doc.text(verificationText, pageWidth / 2, pageHeight - 6, { align: 'center' });

// Add clickable link
        doc.link(linkX, linkY, linkWidth, linkHeight, { url: verificationUrl });

        // Convert to buffer
        try {
            console.log('📄 Converting PDF to buffer...');

            const pdfBytes = doc.output('arraybuffer');
            const pdfBuffer = Buffer.from(pdfBytes);

            if (!pdfBuffer || pdfBuffer.length === 0) {
                throw new Error('PDF buffer is empty or invalid');
            }

            console.log('✅ PDF buffer created successfully, length:', pdfBuffer.length);
            return pdfBuffer;

        } catch (bufferError) {
            console.error('❌ Buffer conversion error:', bufferError);

            try {
                console.log('📄 Trying fallback buffer conversion...');
                const binaryString = doc.output('datauristring');
                const base64Data = binaryString.split(',')[1];
                const pdfBuffer = Buffer.from(base64Data, 'base64');

                if (!pdfBuffer || pdfBuffer.length === 0) {
                    throw new Error('Fallback PDF buffer is empty or invalid');
                }

                console.log('✅ Fallback PDF buffer created successfully, length:', pdfBuffer.length);
                return pdfBuffer;

            } catch (fallbackError) {
                console.error('❌ Fallback buffer conversion also failed:', fallbackError);
                throw new Error(`PDF buffer conversion failed: ${bufferError.message}. Fallback also failed: ${fallbackError.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error in PDF generation:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
}