'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const features = [
  {
    icon: '📅',
    title: 'Itinerario por día',
    description: 'Todos los días del viaje, incluso los vacíos. Agrega panoramas con fecha y hora opcionales.',
    color: 'from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/5',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  {
    icon: '🏨',
    title: 'Gestión de hoteles',
    description: 'Registra alojamientos, precios y fechas. Calcula el costo estimado por persona automáticamente.',
    color: 'from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  {
    icon: '💸',
    title: 'Gastos al estilo Splitwise',
    description: 'Divide gastos en múltiples monedas. Ve exactamente quién le debe a quién al final.',
    color: 'from-violet-500/10 to-violet-500/5 dark:from-violet-500/20 dark:to-violet-500/5',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
  },
  {
    icon: '👥',
    title: 'Participantes flexibles',
    description: 'Invita usuarios registrados o agrega "participantes fantasma" solo para dividir gastos.',
    color: 'from-orange-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-orange-500/5',
    border: 'border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50',
  },
  {
    icon: '🔐',
    title: 'Roles y permisos',
    description: 'Admin, Editor y Visualizador. Control granular sobre quién puede modificar el viaje.',
    color: 'from-rose-500/10 to-rose-500/5 dark:from-rose-500/20 dark:to-rose-500/5',
    border: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
  },
  {
    icon: '🌍',
    title: 'Multi-moneda',
    description: 'CLP, JPY, USD, EUR, KRW y más. Perfecto para viajes internacionales largos.',
    color: 'from-sky-500/10 to-sky-500/5 dark:from-sky-500/20 dark:to-sky-500/5',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50',
  },
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) router.push('/dashboard');
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Unko Trip</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Comenzar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-800">
            <span>🇯🇵</span> Diseñado para viajes largos en grupo
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
            Organiza tu viaje{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              en grupo
            </span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
            Itinerario día a día, hoteles, gastos compartidos y mucho más. Todo en un solo lugar para que el grupo esté siempre sincronizado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/auth/signin"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/25"
            >
              Empezar gratis con Google
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Ver características
            </a>
          </div>
        </div>

        {/* Hero visual — mock UI */}
        <div className="mt-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium mb-0.5">← Dashboard</p>
                <h3 className="text-white font-bold text-lg">Japón 2025 🇯🇵</h3>
                <p className="text-blue-200 text-sm">Tokio · 01/06 → 30/06 · <span className="font-semibold">30 días</span></p>
              </div>
              <div className="hidden sm:flex gap-2">
                {['📅 Itinerario', '🏨 Hoteles', '👥 Grupo'].map((tab, i) => (
                  <span key={tab} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${i === 0 ? 'bg-white/20 text-white' : 'text-blue-200'}`}>
                    {tab}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {[
              { day: 1, date: 'lunes, 1 de junio de 2025', items: ['Llegada aeropuerto Narita', 'Check-in Shinjuku Hotel'], today: true },
              { day: 2, date: 'martes, 2 de junio de 2025', items: ['Templo Senso-ji', 'Akihabara'], today: false },
              { day: 3, date: 'miércoles, 3 de junio de 2025', items: [], today: false },
            ].map((d) => (
              <div key={d.day} className={`rounded-xl border overflow-hidden ${d.today ? 'border-blue-400 dark:border-blue-600' : 'border-gray-200 dark:border-gray-800'}`}>
                <div className={`px-4 py-2.5 flex items-center gap-3 ${d.today ? 'bg-blue-50 dark:bg-blue-950/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.today ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    Día {d.day}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{d.date}</span>
                  {d.today && <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Hoy</span>}
                </div>
                <div className="px-4 py-2.5 space-y-1.5 bg-white dark:bg-gray-900">
                  {d.items.length === 0
                    ? <p className="text-sm text-gray-400 italic">Día libre</p>
                    : d.items.map((a) => (
                      <div key={a} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>📍</span> {a}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Todo lo que necesitas</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">Para que nada se pierda en un viaje largo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6`}>
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl p-12 text-white shadow-2xl shadow-blue-600/20">
            <h2 className="text-4xl font-bold mb-4">¿Listo para planear tu viaje?</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Empieza en minutos. Sin tarjeta de crédito. Solo tú y tu grupo.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Empezar con Google →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>✈️</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Unko Trip</span>
          </div>
          <p>© 2026 Unko Trip. Hecho para viajeros grupales.</p>
        </div>
      </footer>
    </div>
  );
}
