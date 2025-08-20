// src/app/verify/[certificateId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CertificateDetails {
    certificateId: string;
    userEmail: string;
    issueDate: string;
    digitalSignature: string;
    status: 'active' | 'revoked' | 'not_found';
    createdAt: string;
}

export default function CertificateVerificationPage({
                                                        params
                                                    }: {
    params: { certificateId: string }
}) {
    const [certificate, setCertificate] = useState<CertificateDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyCertificate = async () => {
            try {
                const response = await fetch(`/api/certificate/verify?id=${params.certificateId}`);

                if (response.ok) {
                    const data = await response.json();
                    setCertificate(data);
                } else if (response.status === 404) {
                    setCertificate({
                        certificateId: params.certificateId,
                        userEmail: '',
                        issueDate: '',
                        digitalSignature: '',
                        status: 'not_found',
                        createdAt: ''
                    });
                } else {
                    throw new Error('Verification failed');
                }
            } catch (err) {
                setError('Failed to verify certificate');
            } finally {
                setLoading(false);
            }
        };

        verifyCertificate();
    }, [params.certificateId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying certificate...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center">
                    <div className="bg-red-100 p-8 rounded-lg">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-red-800 mb-2">Verification Error</h1>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const isValid = certificate?.status === 'active';
    const isNotFound = certificate?.status === 'not_found';
    const isRevoked = certificate?.status === 'revoked';

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
                    <p className="text-gray-600">Digital Ownership Certificate Validation System</p>
                </div>

                {/* Verification Result */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Status Banner */}
                    <div className={`p-6 ${
                        isValid ? 'bg-green-500' :
                            isRevoked ? 'bg-yellow-500' :
                                'bg-red-500'
                    }`}>
                        <div className="flex items-center justify-center text-white">
                            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                                {isValid ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {isValid ? 'Certificate Valid' :
                                        isRevoked ? 'Certificate Revoked' :
                                            'Certificate Not Found'}
                                </h2>
                                <p className="text-white text-opacity-90">
                                    {isValid ? 'This certificate is authentic and active' :
                                        isRevoked ? 'This certificate has been revoked' :
                                            'No matching certificate found in our records'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="p-6">
                        {isValid && certificate && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Certificate ID
                                        </label>
                                        <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                                            {certificate.certificateId}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Account Holder
                                        </label>
                                        <p className="text-gray-900 font-medium">
                                            {certificate.userEmail}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Issue Date
                                        </label>
                                        <p className="text-gray-900">
                                            {certificate.issueDate}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Status
                                        </label>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Digital Signature
                                    </label>
                                    <p className="text-gray-900 font-mono text-xs bg-gray-100 p-3 rounded break-all">
                                        {certificate.digitalSignature}
                                    </p>
                                </div>

                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                    <h3 className="font-medium text-indigo-900 mb-2">Certificate Grants</h3>
                                    <p className="text-indigo-800 text-sm mb-3">
                                        This certificate establishes the holder's complete ownership of all logos created
                                        through the AI Logo Generator platform, including:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-indigo-700 text-sm">
                                        <div>• Full commercial usage rights</div>
                                        <div>• Transfer and resale permissions</div>
                                        <div>• Modification and editing rights</div>
                                        <div>• Complete copyright ownership</div>
                                        <div>• Distribution and licensing rights</div>
                                        <div>• Trademark usage permissions</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isNotFound && (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">
                                    Certificate ID: <span className="font-mono text-sm">{params.certificateId}</span>
                                </p>
                                <p className="text-gray-600">
                                    This certificate ID was not found in our verification database.
                                    Please check the ID and try again, or contact support if you believe this is an error.
                                </p>
                            </div>
                        )}

                        {isRevoked && certificate && (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">
                                    This certificate was issued to <strong>{certificate.userEmail}</strong> on {certificate.issueDate}
                                    but has since been revoked.
                                </p>
                                <p className="text-gray-600">
                                    Revoked certificates are no longer valid for ownership verification.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <p className="text-sm text-gray-500 mb-2 sm:mb-0">
                                AI Logo Generator Platform • Certificate Verification System
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                Return to Platform
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="mt-8 bg-white rounded-lg p-6 shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">About Certificate Verification</h3>
                    <div className="prose text-sm text-gray-600">
                        <p>
                            This verification system validates the authenticity of Digital Ownership Certificates
                            issued by the AI Logo Generator platform. Each certificate contains a unique ID and
                            cryptographic signature that can be verified against our secure database.
                        </p>
                        <p className="mt-3">
                            Valid certificates establish legal ownership of all logos created through the platform
                            and serve as proof of intellectual property rights for commercial and legal purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
