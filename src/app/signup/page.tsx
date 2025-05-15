// src/app/signup/page.tsx
'use client';

import { Suspense } from 'react';
import SignupForm from './SignupForm'; // We'll create this component next

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-page-container">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}