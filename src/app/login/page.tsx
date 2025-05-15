// src/app/login/page.tsx
'use client';

import { Suspense } from 'react';
import LoginForm from './LoginForm'; // We'll create this component next

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page-container">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}