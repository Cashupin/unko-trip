'use client';

import { getUserTrips } from '@/actions/trips';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatDateShort } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserTrips().then((result) => {
      if (result.success && result.data) setTrips(result.data);
      setIsLoading(false);
    });
  }, []);

  const handleSignOut = () => signOut({ redirect: true, callbackUrl: '/' });

  const gradients = [
    'from-blue-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-600',
    'from-sky-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span>✈️</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Unko Trip</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user?.image && (
              <img src={session.user.image} alt={session.user.name || ''} className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              {session?.user?.name}
            </span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Title row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis viajes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona y organiza tus aventuras grupales</p>
          </div>
          <Link
            href="/trips/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-600/25"
          >
            <span className="text-lg leading-none">+</span> Nuevo viaje
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
                <div className="h-28 bg-gray-200 dark:bg-gray-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && trips.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5">
              ✈️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sin viajes aún</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Crea tu primer viaje grupal y empieza a planear tu próxima aventura
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Crear primer viaje
            </Link>
          </div>
        )}

        {/* Trip grid */}
        {!isLoading && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip, i) => {
              const gradient = gradients[i % gradients.length];
              const participantCount = trip.participants?.length || 0;
              const start = new Date(trip.startDate);
              const end = new Date(trip.endDate);
              const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`bg-gradient-to-br ${gradient} h-28 p-5 flex flex-col justify-end`}>
                    <div className="flex items-center gap-1.5">
                      {[...Array(Math.min(participantCount, 3))].map((_, j) => (
                        <div key={j} className="w-6 h-6 rounded-full bg-white/30 ring-2 ring-white/50 flex items-center justify-center text-xs">
                          👤
                        </div>
                      ))}
                      {participantCount > 3 && (
                        <span className="text-xs text-white/80">+{participantCount - 3}</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {trip.name}
                    </h3>
                    {trip.destination && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">📍 {trip.destination}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
                      <span>📅 {formatDateShort(start)} → {formatDateShort(end)}</span>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{days}d · {participantCount}p</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
