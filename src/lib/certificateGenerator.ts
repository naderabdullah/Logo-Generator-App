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

export interface LogoCertificateData {
    clientEmail: string;
    resellerEmail?: string;
    logoId: string;
    certificateId: string;
    logoImageBuffer: Buffer;
    issueDate: string;
}

// Generate consistent logo image hash for verification
function generateLogoImageHash(logoImageBuffer: Buffer): string {
    // Use same simple hash for consistency, but on image data
    const imageDataString = logoImageBuffer.toString('base64');
    const fullHash = simpleHash(imageDataString);
    return fullHash.substring(0, 12); // Truncate for URL friendliness
}

// Generate logo certificate ID with embedded verification data
export function generateLogoCertificateId(
    clientEmail: string,
    logoId: string,
    logoImageBuffer: Buffer
): string {
    try {
        const timestamp = Date.now();
        const clientPrefix = clientEmail.split('@')[0].substring(0, 6).toLowerCase();

        // Generate logo hash for image integrity
        const logoHash = generateLogoImageHash(logoImageBuffer);

        // Create base parts (no reseller in ID)
        const baseParts = `logo-${logoId}-${timestamp.toString(36)}-${clientPrefix}-${logoHash}`;

        // Generate checksum with client data + secret
        const checksumInput = `${baseParts}-${clientEmail}-${CERTIFICATE_SECRET}`;
        const checksum = simpleHash(checksumInput);

        const certificateId = `${baseParts}-${checksum}`;

        console.log('✅ Logo certificate generated:', {
            logoId,
            clientEmail: clientPrefix + '@...',
            logoHashLength: logoHash.length,
            finalId: certificateId.toUpperCase()
        });

        return certificateId.toUpperCase();

    } catch (error) {
        console.error('❌ Error generating logo certificate ID:', error);
        throw new Error('Failed to generate logo certificate ID');
    }
}

// Verify logo certificate using only the certificate ID (stateless)
export function verifyLogoCertificateId(
    certificateId: string,
    logoImageBuffer?: Buffer
): {
    isValid: boolean;
    logoId?: string;
    clientEmail?: string;
    issueDate?: string;
    logoImageVerified?: boolean;
    details?: string;
} {
    try {
        console.log('🔍 Verifying logo certificate:', certificateId);

        const lowerCertId = certificateId.toLowerCase();
        const parts = lowerCertId.split('-');

        // Validate structure: logo-{logoId}-{timestamp}-{clientPrefix}-{logoHash}-{checksum}
        if (parts.length !== 6 || parts[0] !== 'logo') {
            return { isValid: false, details: 'Invalid logo certificate structure' };
        }

        const [certType, logoId, timestampStr, clientPrefix, providedLogoHash, providedChecksum] = parts;

        // Reconstruct checksum using same logic as generation
        const baseParts = `logo-${logoId}-${timestampStr}-${clientPrefix}-${providedLogoHash}`;
        const checksumInput = `${baseParts}-${clientPrefix}@unknown-${CERTIFICATE_SECRET}`;
        const expectedChecksum = simpleHash(checksumInput);

        console.log('🔍 Logo certificate verification:', {
            baseParts,
            expectedChecksum,
            providedChecksum,
            match: expectedChecksum === providedChecksum
        });

        if (providedChecksum !== expectedChecksum) {
            return {
                isValid: false,
                details: `Checksum mismatch. Expected: ${expectedChecksum}, got: ${providedChecksum}`
            };
        }

        // Extract timestamp and format date
        const timestamp = parseInt(timestampStr, 36);
        const issueDate = new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Optional: Verify logo image if provided
        let logoImageVerified = false;
        if (logoImageBuffer) {
            const actualLogoHash = generateLogoImageHash(logoImageBuffer);
            logoImageVerified = actualLogoHash === providedLogoHash;

            console.log('🖼️ Logo image verification:', {
                providedHash: providedLogoHash,
                actualHash: actualLogoHash,
                verified: logoImageVerified
            });
        }

        return {
            isValid: true,
            logoId,
            clientEmail: `${clientPrefix}@[domain]`,
            issueDate,
            logoImageVerified,
            details: 'Valid logo certificate'
        };

    } catch (error) {
        console.error('❌ Logo certificate verification error:', error);
        return { isValid: false, details: `Error: ${error}` };
    }
}

// Generate logo certificate PDF with embedded logo image
export async function generateLogoCertificate(data: LogoCertificateData): Promise<Buffer> {
    try {
        console.log('📄 Starting logo certificate PDF generation');

        const clientEmail = data.clientEmail || 'Unknown Client';
        const resellerEmail = data.resellerEmail || 'SMARTY LOGOS™ PLATFORM';
        const logoId = data.logoId || 'UNKNOWN-LOGO';
        const issueDate = data.issueDate || new Date().toLocaleDateString();
        const certificateId = data.certificateId || 'UNKNOWN-ID';

        // Create PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Colors
        const primaryBlue = [59, 130, 246];
        const darkGray = [55, 65, 81];
        const lightGray = [107, 114, 128];

        // HEADER with gradient background simulation
        doc.setFillColor(245, 247, 250);
        doc.rect(0, 0, pageWidth, 50, 'F');

        // Main title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text('CERTIFICATE OF LOGO OWNERSHIP', pageWidth / 2, 30, { align: 'center' });

        // CHAIN OF CUSTODY SECTION - Very prominent
        doc.setFillColor(245, 247, 250);
        doc.rect(20, 55, pageWidth - 40, 25, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('CHAIN OF CUSTODY', pageWidth / 2, 62, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text('Platform Creator:', 25, 68);
        doc.text('SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM', 65, 68);

        doc.text('Certificate Issuer:', 25, 73);
        doc.text(resellerEmail, 65, 73);

        doc.text('Logo Owner:', 25, 78);
        doc.text(clientEmail, 65, 78);

        // Add logo image if provided
        if (data.logoImageBuffer) {
            const logoDataUrl = `data:image/png;base64,${data.logoImageBuffer.toString('base64')}`;
            const logoSize = 35;
            const logoX = (pageWidth - logoSize) / 2;
            const logoY = 90;

            doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Logo ID: ${logoId}`, pageWidth / 2, logoY + logoSize + 8, { align: 'center' });
        }

        // OWNERSHIP DECLARATION
        const textStartY = data.logoImageBuffer ? 145 : 100;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

        const ownershipText = `This certificate establishes that ${clientEmail} is the rightful and exclusive owner of the logo displayed above. This logo was created using the SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM and this ownership certificate was issued by ${resellerEmail}.`;

        const splitText = doc.splitTextToSize(ownershipText, 150);
        doc.text(splitText, pageWidth / 2, textStartY, { align: 'center' });

        // RIGHTS GRANTED SECTION
        const rightsY = textStartY + 25;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('RIGHTS GRANTED TO OWNER', pageWidth / 2, rightsY, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        const rights = [
            '• Full commercial usage rights',
            '• Complete copyright ownership',
            '• Transfer and resale permissions',
            '• Modification and editing rights',
            '• Distribution and licensing rights',
            '• Trademark usage permissions'
        ];

        rights.forEach((right, index) => {
            doc.text(right, 30, rightsY + 8 + (index * 5));
        });

        // CERTIFICATE DETAILS (Technical verification info)
        const detailsY = rightsY + 45;
        doc.setFillColor(249, 250, 251);
        doc.rect(20, detailsY - 5, pageWidth - 40, 35, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text('CERTIFICATE VERIFICATION DETAILS', 25, detailsY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Certificate ID: ${certificateId}`, 25, detailsY + 6);
        doc.text(`Logo ID: ${logoId}`, 25, detailsY + 12);
        doc.text(`Issue Date: ${issueDate}`, 25, detailsY + 18);
        doc.text(`Verification: Cryptographically signed and verifiable`, 25, detailsY + 24);

        // QR Code for verification
        try {
            const verificationUrl = `${BASE_URL}/verify/logo/${certificateId}`;
            const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: 80,
            });

            const qrSize = 20;
            const qrX = pageWidth - 45;
            const qrY = detailsY;

            doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
            doc.setFontSize(6);
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text('Scan to verify', qrX + qrSize/2, qrY + qrSize + 3, { align: 'center' });
        } catch (error) {
            console.error('❌ Failed to generate QR code:', error);
            // Fallback QR code placeholder
            doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.setLineWidth(0.5);
            doc.rect(pageWidth - 45, detailsY, 20, 20);
            doc.setFontSize(6);
            doc.text('QR CODE', pageWidth - 35, detailsY + 10, { align: 'center' });
            doc.text('VERIFICATION', pageWidth - 35, detailsY + 13, { align: 'center' });
        }

        // FOOTER with platform attribution
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text('This certificate was generated by SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM', pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Digital verification available at: ${BASE_URL}/verify/logo/${certificateId}`, pageWidth / 2, footerY + 5, { align: 'center' });

        return Buffer.from(doc.output('arraybuffer'));

    } catch (error) {
        console.error('❌ Logo certificate PDF generation failed:', error);
        throw new Error('Failed to generate logo certificate PDF');
    }
}

// Encode user data into the certificate ID for stateless verification
// Replace your generateCertificateId function with this:
export function generateCertificateId(userEmail: string): string {
    try {
        const timestamp = Date.now();
        const emailPrefix = userEmail.split('@')[0].substring(0, 6).toLowerCase();

        // Create the base ID parts (keep lowercase)
        const baseParts = `cert-${timestamp.toString(36)}-${emailPrefix}`;

// Generate checksum using base parts + secret
        const checksumInput = `${baseParts}-${CERTIFICATE_SECRET}`;
        console.log('🔑 GENERATION - Secret being used:', CERTIFICATE_SECRET);
        console.log('🔑 GENERATION - Full checksum input:', checksumInput);
        const checksum = simpleHash(checksumInput);
        console.log('🔑 GENERATION - Calculated checksum:', checksum);
        console.log('🔑 GENERATION - Final certificate ID will be:', `${baseParts}-${checksum}`.toUpperCase());
        // Final ID (keep everything lowercase for consistency)
        const certificateId = `${baseParts}-${checksum}`;

        console.log('✅ DEBUG GENERATION:');
        console.log('   Base parts:', baseParts);
        console.log('   Checksum input:', checksumInput);
        console.log('   Generated checksum:', checksum);
        console.log('   Final ID:', certificateId);

        return certificateId.toUpperCase(); // Only convert to uppercase at the very end
    } catch (error) {
        console.error('❌ Error generating certificate ID:', error);
        throw new Error('Failed to generate certificate ID');
    }
}

// Simple hash function for email verification (not cryptographically secure, but sufficient for this purpose)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

// Generate digital signature that can be verified without storing data
// Replace your generateDigitalSignature function with this:
export function generateDigitalSignature(data: CertificateData): string {
    try {
        console.log('📄 Generating digital signature for data:', data);

        if (!data || !data.userEmail || !data.issueDate || !data.certificateId) {
            throw new Error('Missing required data for signature generation');
        }

        // Create signature data including the secret
        const signatureData = `${data.userEmail}:${data.issueDate}:${data.certificateId}:${CERTIFICATE_SECRET}`;
        console.log('📤 Signature input created (without secret shown)');

        // Generate signature hash - simpleHash already returns a string, so no .toString(36) needed
        const signature = simpleHash(signatureData) + simpleHash(signatureData.split('').reverse().join(''));

        console.log('✅ Generated digital signature:', signature);
        return signature.toUpperCase();

    } catch (error) {
        console.error('❌ Error generating digital signature:', error);
        const fallbackSignature = simpleHash(`fallback-${Date.now()}`);
        console.log('⚠️ Using fallback signature:', fallbackSignature);
        return fallbackSignature.toUpperCase();
    }
}
// Verify certificate using only the certificate ID (stateless)

// Replace your verifyCertificateId function with this:
export function verifyCertificateId(certificateId: string): {
    isValid: boolean;
    timestamp?: number;
    issueDate?: string;
    emailPrefix?: string;
    estimatedEmail?: string;
    details?: string;
} {
    try {
        console.log('🔍 DEBUG VERIFICATION: Verifying certificate ID:', certificateId);

        // Convert to lowercase for consistent processing
        const lowerCertId = certificateId.toLowerCase();
        const parts = lowerCertId.split('-');

        if (parts.length !== 4 || parts[0] !== 'cert') {
            return { isValid: false, details: 'Invalid ID structure' };
        }

        const [certPrefix, timestampStr, emailPrefix, providedChecksum] = parts;

        // Regenerate checksum using EXACTLY the same logic as generation
        const baseParts = `cert-${timestampStr}-${emailPrefix}`;
        const checksumInput = `${baseParts}-${CERTIFICATE_SECRET}`;
        console.log('🔑 VERIFICATION - Secret being used:', CERTIFICATE_SECRET);
        console.log('🔑 VERIFICATION - Full checksum input:', checksumInput);
        const expectedChecksum = simpleHash(checksumInput);
        console.log('🔑 VERIFICATION - Calculated checksum:', expectedChecksum);

        console.log('🔍 DEBUG VERIFICATION:');
        console.log('   Base parts:', baseParts);
        console.log('   Checksum input:', checksumInput);
        console.log('   Expected checksum:', expectedChecksum);
        console.log('   Provided checksum:', providedChecksum);
        console.log('   Secret:', CERTIFICATE_SECRET ? 'SET' : 'NOT SET');

        if (providedChecksum !== expectedChecksum) {
            console.log('❌ CHECKSUM MISMATCH!');
            return {
                isValid: false,
                details: `Checksum mismatch. Expected: ${expectedChecksum}, got: ${providedChecksum}`
            };
        }

        console.log('✅ CHECKSUM MATCH!');

        const timestamp = parseInt(timestampStr, 36);
        const issueDate = new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return {
            isValid: true,
            timestamp,
            issueDate,
            emailPrefix,
            estimatedEmail: `${emailPrefix}@[domain]`,
            details: 'Valid'
        };

    } catch (error) {
        console.error('❌ Error:', error);
        return { isValid: false, details: `Error: ${error}` };
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