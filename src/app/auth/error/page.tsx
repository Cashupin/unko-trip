'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const errorMessages: Record<string, { title: string; message: string }> = {
  OAuthAccountNotLinked: {
    title: 'Cuenta ya vinculada',
    message: 'Ya tienes una cuenta con un proveedor diferente. Intenta con otro método.',
  },
  Callback: {
    title: 'Error de callback',
    message: 'Ocurrió un problema durante la autenticación. Intenta de nuevo.',
  },
  default: {
    title: 'Error al iniciar sesión',
    message: 'No pudimos completar el inicio de sesión. Por favor intenta de nuevo.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'default';
  const { title, message } = errorMessages[error] ?? errorMessages.default;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
          😕
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{message}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Código de error: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{error}</code>
        </p>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
