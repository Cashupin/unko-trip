'use client';

import { createTrip } from '@/actions/trips';
import { ThemeToggle } from '@/components/theme-toggle';
import { CURRENCIES, CURRENCY_NAMES } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const form = e.currentTarget;
    const data = new FormData(form);

    const result = await createTrip({
      name: data.get('name') as string,
      description: data.get('description') as string,
      destination: data.get('destination') as string,
      startDate: new Date(data.get('startDate') as string),
      endDate: new Date(data.get('endDate') as string),
      defaultCurrency: data.get('defaultCurrency') as string,
    });

    if (result.success && result.data) {
      router.push(`/trips/${result.data.id}`);
    } else {
      setError(result.error || 'Error al crear el viaje');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm font-medium"
            >
              ← Volver
            </Link>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Nuevo viaje</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crea tu viaje</h2>
          <p className="text-gray-500 dark:text-gray-400">Completa los detalles básicos. Podrás agregar participantes, actividades y hoteles después.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre del viaje <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ej: Japón 2025"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Destino
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                placeholder="Ej: Tokio, Osaka, Kioto"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="¿De qué trata el viaje?"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Fecha de inicio <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Fecha de término <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="defaultCurrency" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Moneda principal
              </label>
              <select
                id="defaultCurrency"
                name="defaultCurrency"
                defaultValue="CLP"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
              >
                {Object.keys(CURRENCIES).map((code) => (
                  <option key={code} value={code}>
                    {code} — {CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES]}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando viaje...
                </span>
              ) : (
                'Crear viaje →'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
