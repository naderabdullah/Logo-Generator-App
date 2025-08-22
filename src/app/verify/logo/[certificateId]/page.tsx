'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LogoCertificate {
    certificateId: string;
    logoId: string;
    clientEmail: string;
    clientHandle?: string; // ✅ Added client handle field
    issueDate: string;
    status: string;
    verified: boolean;
    verificationMethod: string;
}

export default function LogoVerificationPage({ params }: { params: { certificateId: string } }) {
    const [certificate, setCertificate] = useState<LogoCertificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyCertificate = async () => {
            try {
                console.log('🔍 Verifying logo certificate:', params.certificateId);

                const response = await fetch(`/api/certificate/logo/verify?id=${params.certificateId}`);

                if (response.ok) {
                    const data = await response.json();
                    setCertificate(data);
                    console.log('✅ Certificate verification successful:', data);
                } else if (response.status === 404) {
                    setError('Certificate not found');
                } else {
                    setError('Verification failed');
                }
            } catch (err) {
                console.error('❌ Certificate verification error:', err);
                setError('Failed to verify certificate');
            } finally {
                setLoading(false);
            }
        };

        verifyCertificate();
    }, [params.certificateId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying logo certificate...</p>
                </div>
            </div>
        );
    }

    const isValid = certificate?.status === 'active' && certificate?.verified;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Logo Certificate Verification</h1>
                    <p className="text-gray-600">Digital Logo Ownership Certificate Validation System</p>
                </div>

                {/* Verification Result */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Status Banner */}
                    <div className={`p-6 ${isValid ? 'bg-green-500' : 'bg-red-500'}`}>
                        <div className="flex items-center justify-center text-white">
                            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                                {isValid ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {isValid ? 'Logo Certificate Valid' : 'Certificate Invalid'}
                                </h2>
                                <p className="text-sm opacity-90">
                                    {isValid ? 'This logo certificate is authentic and verified' :
                                        error || 'This certificate could not be verified'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Certificate Details */}
                    {isValid && certificate && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4z"/>
                                        </svg>
                                        Logo Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                            <span className="text-sm font-medium text-blue-700">Logo ID:</span>
                                            <p className="font-mono text-lg font-bold text-blue-900">{certificate.logoId}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Owner:</span>
                                            <p className="text-gray-900 font-medium text-lg">{certificate.clientEmail}</p> {/* ✅ Display actual email */}
                                        </div>
                                        {certificate.clientHandle && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Client Handle:</span> {/* ✅ Different label for handle */}
                                                <p className="text-gray-700 font-mono">@{certificate.clientHandle}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Issue Date:</span>
                                            <p className="text-gray-900">{certificate.issueDate}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Status:</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Verified & Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ownership Rights */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                        </svg>
                                        Ownership Rights
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Full commercial usage rights
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Complete copyright ownership
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Transfer and resale permissions
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Modification and editing rights
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Distribution and licensing rights
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Trademark usage permissions
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chain of Custody */}
                            <div className="mt-6 bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                <h4 className="font-semibold text-indigo-900 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    Chain of Custody
                                </h4>
                                <div className="text-sm text-indigo-800 space-y-1">
                                    <div><strong>Platform Creator:</strong> SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM</div>
                                    <div><strong>Certificate Issuer:</strong> Authorized Reseller</div>
                                    <div><strong>Current Owner:</strong> {certificate.clientEmail}</div> {/* ✅ Show actual email */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {!isValid && (
                        <div className="p-6 text-center">
                            <p className="text-gray-600 mb-4">
                                Certificate ID: <span className="font-mono text-sm">{params.certificateId}</span>
                            </p>
                            <p className="text-gray-600">
                                This logo certificate ID was not found in our verification system.
                                Please check the ID and try again, or contact support if you believe this is an error.
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <p className="text-sm text-gray-500 mb-2 sm:mb-0">
                                SMARTY LOGOS™ • Logo Certificate Verification System
                            </p>
                            <Link href="/" className="text-sm text-blue-600 hover:text-blue-500 flex items-center">
                                Return to Platform
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="mt-8 bg-white rounded-lg p-6 shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">About Logo Certificate Verification</h3>
                    <div className="prose text-sm text-gray-600">
                        <p>
                            This verification system validates the authenticity of Digital Logo Ownership Certificates
                            issued by the SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM. Each certificate contains a unique
                            ID and cryptographic signature that can be verified without requiring database access.
                        </p>
                        <p className="mt-3">
                            Valid certificates establish legal ownership of specific logos created through the platform
                            and serve as proof of intellectual property rights for commercial and legal purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}