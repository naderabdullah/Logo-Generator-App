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
        const clientPrefix = clientEmail.split('@')[0].toLowerCase();

        // Generate logo hash for image integrity
        const logoHash = generateLogoImageHash(logoImageBuffer);

        // Create base parts (no reseller in ID)
        const baseParts = `logo-${logoId}-${timestamp.toString(36)}-${clientPrefix}-${logoHash}`;

        // Generate checksum with client data + secret
        const checksumInput = `${baseParts}-${CERTIFICATE_SECRET}`;
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

// Backward compatible verification that handles both old and new certificate formats
// Replace the verifyLogoCertificateId function in src/lib/certificateGenerator.ts
// Verify logo certificate using only the certificate ID (stateless)

export function verifyLogoCertificateId(
    certificateId: string,
    logoImageBuffer?: Buffer
): {
    isValid: boolean;
    logoId?: string;
    clientEmail?: string;
    clientHandle?: string;
    issueDate?: string;
    logoImageVerified?: boolean;
    details?: string;
} {
    try {
        console.log('🔍 Verifying logo certificate:', certificateId);

        const upperCertId = certificateId.toUpperCase();

        if (!upperCertId.startsWith('LOGO-')) {
            return { isValid: false, details: 'Invalid logo certificate format' };
        }

        // Remove LOGO- prefix and parse
        const remaining = upperCertId.substring(5);
        const parts = remaining.split('-');

        if (parts.length < 5) {
            return { isValid: false, details: 'Invalid certificate ID structure' };
        }

        // Extract from end: checksum, logoHash, clientPrefix, timestampStr
        const providedChecksum = parts[parts.length - 1];
        const logoHash = parts[parts.length - 2];
        const clientPrefix = parts[parts.length - 3];
        const timestampStr = parts[parts.length - 4];

        // Everything before timestamp is logoId
        const logoIdParts = parts.slice(0, parts.length - 4);
        const logoId = logoIdParts.join('-');

        // Reconstruct baseParts exactly as in generation
        const baseParts = `logo-${logoId.toLowerCase()}-${timestampStr.toLowerCase()}-${clientPrefix.toLowerCase()}-${logoHash.toLowerCase()}`;

        // Generate checksum with full handle
        const checksumInput = `${baseParts}-${CERTIFICATE_SECRET}`;
        const expectedChecksum = simpleHash(checksumInput);

        if (expectedChecksum.toUpperCase() !== providedChecksum) {
            return {
                isValid: false,
                details: `Security verification failed. Certificate checksum mismatch.`
            };
        }

        const timestamp = parseInt(timestampStr, 36);
        const issueDate = new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return {
            isValid: true,
            logoId: logoId.toLowerCase(),
            clientEmail: `${clientPrefix.toLowerCase()}@[domain-verified-separately]`,
            clientHandle: clientPrefix.toLowerCase(), // ✅ Full handle
            issueDate,
            logoImageVerified: false,
            details: 'Certificate verified using secure checksum validation with full email handle'
        };

    } catch (error) {
        console.error('❌ Logo certificate verification error:', error);
        return { isValid: false, details: `Verification error: ${error}` };
    }
}

// Generate logo certificate PDF with embedded logo image
// Improved generateLogoCertificate function with better formatting
// Replace the entire generateLogoCertificate function in src/lib/certificateGenerator.ts

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
        const backgroundGray = [245, 247, 250];

        // HEADER SECTION (0-45mm)
        doc.setFillColor(backgroundGray[0], backgroundGray[1], backgroundGray[2]);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // Main title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text('CERTIFICATE OF LOGO OWNERSHIP', pageWidth / 2, 25, { align: 'center' });

        // CHAIN OF CUSTODY SECTION (50-85mm) - Updated with larger Logo Owner font
        doc.setFillColor(245, 247, 250);
        doc.rect(15, 50, pageWidth - 30, 35, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('CERTIFICATE HIERARCHY & CHAIN OF CUSTODY', pageWidth / 2, 58, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

// Platform Owner
        doc.text('Platform Owner:', 20, 66);
        doc.setFont('helvetica', 'bold');
        doc.text('SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM', 65, 66);

// Certificate Issuer (Reseller)
        doc.setFont('helvetica', 'normal');
        doc.text('Certificate Issuer:', 20, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(resellerEmail, 65, 72);

// Logo Owner (Client) - LARGER FONT
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10); // ✅ Increased from 9 to 10 for Logo Owner
        doc.text('Logo Owner:', 20, 78);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10); // ✅ Keep larger font for the email too
        doc.text(clientEmail, 65, 78);

// Reset font size for subsequent content
        doc.setFontSize(9);

        // LOGO IMAGE SECTION (90-155mm) - Much larger logo
        if (data.logoImageBuffer) {
            const logoDataUrl = `data:image/png;base64,${data.logoImageBuffer.toString('base64')}`;
            const logoSize = 55; // Increased from 35 to 55mm
            const logoX = (pageWidth - logoSize) / 2;
            const logoY = 90;

            doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);

            // Logo ID below image
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.text(`Logo ID: ${logoId}`, pageWidth / 2, logoY + logoSize + 8, { align: 'center' });
        }

        // OWNERSHIP DECLARATION SECTION (160-185mm)
// OWNERSHIP DECLARATION SECTION (160-185mm) - Updated with bold client and prefix
        const ownershipY = 160;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

// ✅ Updated ownership text with "owner of this email" prefix and bold client email
        const ownershipText = `This certificate establishes that the owner of this email `;
        const boldClientEmail = clientEmail;
        const ownershipTextEnd = ` is the rightful and exclusive owner of the logo displayed above. This logo was created using the SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM and this ownership certificate was issued by ${resellerEmail} acting as an authorized reseller.`;

// Split the text into parts to make client email bold
        const textWidth = 160;
        const startText = doc.splitTextToSize(ownershipText, textWidth);
        const endText = doc.splitTextToSize(ownershipTextEnd, textWidth);

// Calculate positioning
        let currentY = ownershipY;

// Print first part
        doc.setFont('helvetica', 'normal');
        doc.text(startText, pageWidth / 2, currentY, { align: 'center' });
        currentY += startText.length * 4;

// Print client email in bold
        doc.setFont('helvetica', 'bold');
        doc.text(boldClientEmail, pageWidth / 2, currentY, { align: 'center' });
        currentY += 4;

// Print remaining text
        doc.setFont('helvetica', 'normal');
        doc.text(endText, pageWidth / 2, currentY, { align: 'center' });

        // RIGHTS GRANTED SECTION (190-220mm)
        const rightsY = 190;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('RIGHTS GRANTED TO OWNER', pageWidth / 2, rightsY, { align: 'center' });

        doc.setFontSize(9);
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

        // Split rights into two columns for better space usage
        const leftColumn = rights.slice(0, 3);
        const rightColumn = rights.slice(3);

        leftColumn.forEach((right, index) => {
            doc.text(right, 25, rightsY + 8 + (index * 5));
        });

        rightColumn.forEach((right, index) => {
            doc.text(right, 110, rightsY + 8 + (index * 5));
        });

        // CERTIFICATE VERIFICATION SECTION (225-255mm)
        const verificationY = 225;
        doc.setFillColor(backgroundGray[0], backgroundGray[1], backgroundGray[2]);
        doc.rect(15, verificationY - 3, pageWidth - 30, 30, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text('CERTIFICATE VERIFICATION DETAILS', 20, verificationY + 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

        // Certificate details in left column
        doc.text(`Certificate ID:`, 20, verificationY + 9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${certificateId}`, 20, verificationY + 13);

        doc.setFont('helvetica', 'normal');
        doc.text(`Logo ID: ${logoId}`, 20, verificationY + 17);
        doc.text(`Issue Date: ${issueDate}`, 20, verificationY + 21);

        // QR Code in right area (smaller and better positioned)
        try {
            const verificationUrl = `${BASE_URL}/verify/logo/${certificateId}`;
            const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 200,
                margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' }
            });

            const qrSize = 20; // Smaller QR code
            const qrX = pageWidth - 35;
            const qrY = verificationY + 2;

            doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            doc.setFontSize(7);
            doc.text('Scan to verify', qrX + (qrSize/2), qrY + qrSize + 3, { align: 'center' });
        } catch (qrError) {
            console.warn('QR code generation failed:', qrError);
        }

        // FOOTER SECTION (260-280mm)
        const footerY = 260;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);

        doc.text('This certificate was generated by SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM',
            pageWidth / 2, footerY, { align: 'center' });

        const verificationUrl = `${BASE_URL}/verify/logo/${certificateId}`;
        const urlText = doc.splitTextToSize(`Digital verification available at: ${verificationUrl}`, pageWidth - 30);
        doc.text(urlText, pageWidth / 2, footerY + 5, { align: 'center' });

        // Convert to buffer and return
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        console.log('✅ Logo certificate PDF generated successfully');
        return pdfBuffer;

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
        const emailPrefix = userEmail.split('@')[0].toLowerCase();

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
export function verifyCertificateId(certificateId: string, userEmail?: string): { // ✅ Added optional parameter
    isValid: boolean;
    timestamp?: number;
    issueDate?: string;
    emailPrefix?: string;
    userEmail?: string;
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
            userEmail: userEmail || `${emailPrefix}@[domain]`,
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
                const bufferErrorMsg = bufferError instanceof Error ? bufferError.message : String(bufferError);
                const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`PDF buffer conversion failed: ${bufferErrorMsg}. Fallback also failed: ${fallbackErrorMsg}`);
            }
        }

    } catch (error) {
        console.error('❌ Error in PDF generation:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`PDF generation failed: ${errorMsg}`);
    }
}