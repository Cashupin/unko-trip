'use client';

import { getTripById, deleteTrip, updateTrip } from '@/actions/trips';
import { createActivity, deleteActivity } from '@/actions/activities';
import { createHotel, deleteHotel } from '@/actions/hotels';
import { createExpense, deleteExpense } from '@/actions/expenses';
import { inviteParticipant, removeParticipant, updateParticipantRole } from '@/actions/participants';
import { createPayment, deletePayment } from '@/actions/payments';
import { ThemeToggle } from '@/components/theme-toggle';
import { CURRENCIES, CURRENCY_NAMES, CURRENCY_SYMBOLS, TRIP_ROLE_LABELS } from '@/lib/constants';
import { calculateSettlement } from '@/lib/settlement';
import { generateDateRange, formatDate, formatDateShort } from '@/lib/utils';
import { TripRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';

type Tab = 'itinerario' | 'hoteles' | 'gastos' | 'participantes';

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('itinerario');

  // Activity
  const [showActivityForm, setShowActivityForm] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityLocation, setActivityLocation] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  // Hotel
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [hotelSubmitting, setHotelSubmitting] = useState(false);

  // Expense
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [expenseAmount, setExpenseAmount] = useState('');

  // Participants
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TripRole>(TripRole.VIEWER);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Edit trip modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const loadTrip = useCallback(async () => {
    const result = await getTripById(tripId);
    if (result.success && result.data) {
      setTrip(result.data);
      // Default: all participants selected for expense split
      const ids = new Set<string>(result.data.participants.map((p: any) => p.id as string));
      setSelectedParticipants(ids);
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  }, [tripId, router]);

  useEffect(() => { loadTrip(); }, [loadTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando viaje...</p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const currentParticipant = trip.participants.find((p: any) => p.user?.email === session?.user?.email);
  const canEdit = currentParticipant?.role === TripRole.ADMIN || currentParticipant?.role === TripRole.EDITOR;
  const isAdmin = currentParticipant?.role === TripRole.ADMIN;

  const tripDays = generateDateRange(new Date(trip.startDate), new Date(trip.endDate));
  const totalDays = tripDays.length;

  // Settlement data (includes payments already made)
  const { balances: balancesPerCurrency, settlements, currencies: expCurrencies } = calculateSettlement(
    trip.expenses.map((e: any) => ({
      id: e.id,
      amount: e.amount,
      currency: e.currency,
      paidByParticipantId: e.paidByParticipantId,
      participants: e.participants.map((ep: any) => ({ participantId: ep.participantId, amount: ep.amount })),
    })),
    trip.participants.map((p: any) => ({ id: p.id, name: p.name })),
    (trip.payments || []).map((p: any) => ({
      id: p.id,
      fromParticipantId: p.fromParticipantId,
      toParticipantId: p.toParticipantId,
      amount: p.amount,
      currency: p.currency,
    }))
  );

  // ── Handlers ──────────────────────────────────────────────────
  const handleAddActivity = async (dateStr: string) => {
    if (!activityTitle.trim()) return;
    setActivitySubmitting(true);
    await createActivity(tripId, {
      title: activityTitle, location: activityLocation, notes: activityNotes,
      activityDate: dateStr,
      activityTime: activityTime ? `${dateStr}T${activityTime}:00` : undefined,
    });
    setActivityTitle(''); setActivityLocation(''); setActivityNotes(''); setActivityTime('');
    setShowActivityForm(null);
    setActivitySubmitting(false);
    await loadTrip();
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    await deleteActivity(id); await loadTrip();
  };

  const handleHotelSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setHotelSubmitting(true);
    const d = new FormData(e.currentTarget);
    await createHotel(tripId, {
      name: d.get('name') as string, link: d.get('link') as string,
      checkInDate: d.get('checkInDate') as string, checkOutDate: d.get('checkOutDate') as string,
      pricePerNight: d.get('pricePerNight') ? Number(d.get('pricePerNight')) : undefined,
      totalPrice: d.get('totalPrice') ? Number(d.get('totalPrice')) : undefined,
      currency: d.get('currency') as string, notes: d.get('notes') as string,
    });
    (e.target as HTMLFormElement).reset();
    setShowHotelForm(false); setHotelSubmitting(false); await loadTrip();
  };

  const handleDeleteHotel = async (id: string) => {
    if (!confirm('¿Eliminar este hotel?')) return;
    await deleteHotel(id); await loadTrip();
  };

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseSubmitting(true);
    const d = new FormData(e.currentTarget);

    const participantIds = [...selectedParticipants];
    if (participantIds.length === 0) {
      setExpenseError('Selecciona al menos un participante');
      setExpenseSubmitting(false);
      return;
    }

    const result = await createExpense(tripId, {
      description: d.get('description') as string,
      amount: Number(d.get('amount')),
      currency: d.get('currency') as string,
      paidByParticipantId: d.get('paidBy') as string,
      expenseDate: d.get('expenseDate') as string,
      splitType,
      participantIds,
      customAmounts: splitType === 'CUSTOM'
        ? Object.fromEntries(Object.entries(customAmounts).map(([k, v]) => [k, Number(v) || 0]))
        : undefined,
    });

    if (result.success) {
      (e.target as HTMLFormElement).reset();
      setShowExpenseForm(false);
      setSplitType('EQUAL');
      setExpenseAmount('');
      const ids = new Set<string>(trip.participants.map((p: any) => p.id as string));
      setSelectedParticipants(ids);
      setCustomAmounts({});
      await loadTrip();
    } else {
      setExpenseError(result.error || 'Error al registrar');
    }
    setExpenseSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await deleteExpense(id); await loadTrip();
  };

  const handleMarkAsPaid = async (fromId: string, toId: string, amount: number, currency: string) => {
    const result = await createPayment(tripId, { fromParticipantId: fromId, toParticipantId: toId, amount, currency });
    if (result.success) await loadTrip();
    else alert(result.error || 'Error al registrar pago');
  };

  const handleUndoPayment = async (paymentId: string) => {
    if (!confirm('¿Deshacer este pago?')) return;
    const result = await deletePayment(paymentId);
    if (result.success) await loadTrip();
    else alert(result.error || 'Error al deshacer pago');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault(); setInviteError(''); setInviteSubmitting(true);
    const result = await inviteParticipant(tripId, { emailOrName: inviteEmail, role: inviteRole });
    if (result.success) { setInviteEmail(''); setShowInviteForm(false); await loadTrip(); }
    else setInviteError(result.error || 'Error al invitar');
    setInviteSubmitting(false);
  };

  const handleRemoveParticipant = async (id: string) => {
    if (!confirm('¿Remover este participante?')) return;
    await removeParticipant(id); await loadTrip();
  };

  const handleRoleChange = async (id: string, role: TripRole) => {
    await updateParticipantRole(id, role); await loadTrip();
  };

  const handleDeleteTrip = async () => {
    if (!confirm(`¿Eliminar "${trip.name}"? Esta acción no se puede deshacer.`)) return;
    const result = await deleteTrip(tripId);
    if (result.success) router.push('/dashboard');
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    const d = new FormData(e.currentTarget);
    const result = await updateTrip(tripId, {
      name: d.get('name') as string,
      description: d.get('description') as string,
      destination: d.get('destination') as string,
      startDate: new Date(d.get('startDate') as string),
      endDate: new Date(d.get('endDate') as string),
      defaultCurrency: d.get('defaultCurrency') as string,
    });
    if (result.success) {
      setShowEditModal(false);
      await loadTrip();
    } else {
      setEditError(result.error || 'Error al actualizar');
    }
    setEditSubmitting(false);
  };

  const getActivitiesForDay = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return trip.activities.filter((a: any) => a.activityDate && new Date(a.activityDate).toISOString().split('T')[0] === ds);
  };
  const unscheduled = trip.activities.filter((a: any) => !a.activityDate);

  const totalExpensesByCurrency: Record<string, number> = {};
  for (const e of trip.expenses) {
    totalExpensesByCurrency[e.currency] = (totalExpensesByCurrency[e.currency] || 0) + e.amount;
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'itinerario', label: 'Itinerario', icon: '📅' },
    { key: 'hoteles', label: 'Hoteles', icon: '🏨' },
    { key: 'gastos', label: 'Gastos', icon: '💸' },
    { key: 'participantes', label: 'Participantes', icon: '👥' },
  ];

  // Format date as YYYY-MM-DD for input[type=date]
  const toInputDate = (d: Date) => new Date(d).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Edit Trip Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-black/40 border border-gray-200 dark:border-gray-700 w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Editar viaje</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre <span className="text-red-500">*</span></label>
                <input name="name" type="text" required defaultValue={trip.name}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Destino</label>
                <input name="destination" type="text" defaultValue={trip.destination || ''}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <textarea name="description" rows={2} defaultValue={trip.description || ''}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Inicio <span className="text-red-500">*</span></label>
                  <input name="startDate" type="date" required defaultValue={toInputDate(trip.startDate)}
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Término <span className="text-red-500">*</span></label>
                  <input name="endDate" type="date" required defaultValue={toInputDate(trip.endDate)}
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Moneda principal</label>
                <select name="defaultCurrency" defaultValue={trip.defaultCurrency}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.keys(CURRENCIES).map((code) => (
                    <option key={code} value={code}>{code} — {CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES]}</option>
                  ))}
                </select>
              </div>
              {editError && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {editError}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors">
                  {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/dashboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium shrink-0 transition-colors">
                ← Dashboard
              </Link>
              <span className="text-gray-200 dark:text-gray-700">|</span>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 dark:text-white truncate">{trip.name}</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {trip.destination && <span>{trip.destination} · </span>}
                  {formatDateShort(new Date(trip.startDate))} → {formatDateShort(new Date(trip.endDate))}
                  <span className="ml-1.5 text-blue-600 dark:text-blue-400 font-semibold">{totalDays}d</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isAdmin ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                canEdit ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {TRIP_ROLE_LABELS[currentParticipant?.role as keyof typeof TRIP_ROLE_LABELS] || '—'}
              </span>
              {isAdmin && (
                <>
                  <button onClick={() => { setEditError(''); setShowEditModal(true); }}
                    className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                    ✏️ Editar
                  </button>
                  <button onClick={handleDeleteTrip} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2.5 py-1 border border-red-200 dark:border-red-800 rounded-lg transition-colors">
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {icon} {label}
                {key === 'gastos' && trip.expenses.length > 0 && (
                  <span className="ml-1.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                    {trip.expenses.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── ITINERARIO ── */}
        {activeTab === 'itinerario' && (
          <div className="space-y-3">
            {unscheduled.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">SIN FECHA</p>
                <div className="space-y-2">
                  {unscheduled.map((a: any) => <ActivityCard key={a.id} activity={a} canEdit={canEdit} onDelete={handleDeleteActivity} />)}
                </div>
              </div>
            )}
            {tripDays.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const dayActivities = getActivitiesForDay(day);
              const isFormOpen = showActivityForm === dateStr;

              return (
                <div key={dateStr} className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden shadow-sm dark:shadow-black/20 ${isToday ? 'border-blue-400 dark:border-blue-600' : 'border-gray-200 dark:border-gray-800'}`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${isToday ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>Día {idx + 1}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{formatDate(day)}</span>
                      {isToday && <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Hoy</span>}
                    </div>
                    {canEdit && (
                      <button onClick={() => { setShowActivityForm(isFormOpen ? null : dateStr); setActivityTitle(''); setActivityLocation(''); setActivityNotes(''); setActivityTime(''); }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
                        {isFormOpen ? '✕ Cancelar' : '+ Panorama'}
                      </button>
                    )}
                  </div>
                  <div className="px-5 py-3 space-y-2">
                    {dayActivities.length === 0 && !isFormOpen && <p className="text-sm text-gray-400 dark:text-gray-600 italic">Día libre</p>}
                    {dayActivities.map((a: any) => <ActivityCard key={a.id} activity={a} canEdit={canEdit} onDelete={handleDeleteActivity} />)}
                    {isFormOpen && (
                      <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                        <input type="text" placeholder="Nombre del panorama *" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Lugar" value={activityLocation} onChange={(e) => setActivityLocation(e.target.value)}
                            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <input type="time" value={activityTime} onChange={(e) => setActivityTime(e.target.value)}
                            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <textarea rows={2} placeholder="Notas" value={activityNotes} onChange={(e) => setActivityNotes(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        <button onClick={() => handleAddActivity(dateStr)} disabled={!activityTitle.trim() || activitySubmitting}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                          {activitySubmitting ? 'Guardando...' : 'Agregar panorama'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── HOTELES ── */}
        {activeTab === 'hoteles' && (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button onClick={() => setShowHotelForm(!showHotelForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                  {showHotelForm ? '✕ Cancelar' : '+ Agregar hotel'}
                </button>
              </div>
            )}
            {showHotelForm && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5">Nuevo alojamiento</h3>
                <form onSubmit={handleHotelSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nombre *</label>
                      <input name="name" required placeholder="APA Hotel Shinjuku" className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Link</label>
                      <input name="link" type="url" placeholder="https://..." className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Check-in *</label>
                      <input name="checkInDate" type="date" required className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Check-out *</label>
                      <input name="checkOutDate" type="date" required className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Precio/noche</label>
                      <input name="pricePerNight" type="number" step="0.01" min="0" placeholder="0" className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Precio total</label>
                      <input name="totalPrice" type="number" step="0.01" min="0" placeholder="0" className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Moneda</label>
                      <select name="currency" defaultValue={trip.defaultCurrency} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Notas</label>
                    <textarea name="notes" rows={2} placeholder="Desayuno incluido..." className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <button type="submit" disabled={hotelSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                    {hotelSubmitting ? 'Guardando...' : 'Agregar hotel'}
                  </button>
                </form>
              </div>
            )}
            {trip.hotels.length === 0 && !showHotelForm ? (
              <EmptyState icon="🏨" text="Sin hoteles registrados" subtext={canEdit ? 'Agrega el primer alojamiento del viaje' : undefined} />
            ) : (
              <div className="space-y-3">
                {[...trip.hotels].sort((a: any, b: any) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()).map((hotel: any) => {
                  const price = hotel.totalPrice || (hotel.pricePerNight ? hotel.pricePerNight * hotel.numberOfNights : null);
                  const perPerson = price && trip.participants.length > 0 ? price / trip.participants.length : null;
                  const sym = CURRENCY_SYMBOLS[hotel.currency as keyof typeof CURRENCY_SYMBOLS] || '';
                  return (
                    <div key={hotel.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{hotel.name}</h3>
                            {hotel.link && <a href={hotel.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-xs shrink-0">🔗 Ver</a>}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>📅 {formatDateShort(new Date(hotel.checkInDate))} → {formatDateShort(new Date(hotel.checkOutDate))}</span>
                            <span>🌙 {hotel.numberOfNights}n</span>
                            {price && <span>💰 {sym}{price.toLocaleString()} {hotel.currency}</span>}
                            {perPerson && <span className="text-blue-600 dark:text-blue-400 font-semibold">👤 ~{sym}{Math.round(perPerson).toLocaleString()} p/p</span>}
                          </div>
                          {hotel.notes && <p className="text-xs text-gray-400 mt-1.5 italic">{hotel.notes}</p>}
                        </div>
                        {canEdit && <button onClick={() => handleDeleteHotel(hotel.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors shrink-0">✕</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GASTOS ── */}
        {activeTab === 'gastos' && (
          <div className="space-y-6">
            {/* Summary cards */}
            {Object.keys(totalExpensesByCurrency).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(totalExpensesByCurrency).map(([currency, total]) => (
                  <div key={currency} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{currency}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || ''}{(total as number).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">gasto total</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add expense button */}
            {canEdit && (
              <div className="flex justify-end">
                <button onClick={() => { setShowExpenseForm(!showExpenseForm); setExpenseError(''); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                  {showExpenseForm ? '✕ Cancelar' : '+ Registrar gasto'}
                </button>
              </div>
            )}

            {/* Expense form */}
            {showExpenseForm && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5">Nuevo gasto</h3>
                <form onSubmit={handleExpenseSubmit} className="space-y-5">
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Descripción *</label>
                    <input name="description" required placeholder="Ej: Cena en restaurante Ichiran"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Amount + Currency + Date */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Monto *</label>
                      <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0" value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Moneda</label>
                      <select name="currency" defaultValue={trip.defaultCurrency}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Fecha</label>
                      <input name="expenseDate" type="date" defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* Paid by */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Pagado por *</label>
                    <select name="paidBy" required
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleccionar participante...</option>
                      {trip.participants.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}{p.type === 'GHOST' ? ' 👻' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Split type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Tipo de división</label>
                    <div className="flex gap-2">
                      {(['EQUAL', 'CUSTOM'] as const).map((t) => (
                        <button key={t} type="button" onClick={() => setSplitType(t)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            splitType === t
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                          }`}>
                          {t === 'EQUAL' ? '⚖️ Equitativo' : '✏️ Personalizado'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Participants to split between */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Dividir entre ({selectedParticipants.size} personas
                      {splitType === 'EQUAL' && expenseAmount && selectedParticipants.size > 0
                        ? ` · ${CURRENCY_SYMBOLS[trip.defaultCurrency as keyof typeof CURRENCY_SYMBOLS] || ''}${(Number(expenseAmount) / selectedParticipants.size).toFixed(0)} c/u`
                        : ''})
                    </label>
                    <div className="space-y-2">
                      {trip.participants.map((p: any) => {
                        const isSelected = selectedParticipants.has(p.id);
                        return (
                          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                          }`}
                            onClick={() => setSelectedParticipants((prev) => {
                              const next = new Set(prev);
                              if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                              return next;
                            })}>
                            <input type="checkbox" readOnly checked={isSelected} className="w-4 h-4 text-blue-600 rounded pointer-events-none" />
                            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {p.name}{p.type === 'GHOST' ? ' 👻' : ''}
                            </span>
                            {splitType === 'CUSTOM' && isSelected && (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Monto"
                                value={customAmounts[p.id] || ''}
                                onChange={(e) => { e.stopPropagation(); setCustomAmounts((prev) => ({ ...prev, [p.id]: e.target.value })); }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-28 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                            {splitType === 'EQUAL' && isSelected && expenseAmount && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                                {(Number(expenseAmount) / selectedParticipants.size).toFixed(0)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {expenseError && (
                    <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                      {expenseError}
                    </div>
                  )}

                  <button type="submit" disabled={expenseSubmitting || selectedParticipants.size === 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm">
                    {expenseSubmitting ? 'Registrando...' : 'Registrar gasto'}
                  </button>
                </form>
              </div>
            )}

            {/* Expenses list */}
            {trip.expenses.length === 0 && !showExpenseForm ? (
              <EmptyState icon="💸" text="Sin gastos registrados" subtext={canEdit ? 'Registra el primer gasto del viaje' : undefined} />
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Historial de gastos</h3>
                {[...trip.expenses]
                  .sort((a: any, b: any) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
                  .map((expense: any) => {
                    const sym = CURRENCY_SYMBOLS[expense.currency as keyof typeof CURRENCY_SYMBOLS] || '';
                    const payer = expense.paidBy || expense.createdBy;
                    const share = expense.participants.find((ep: any) => ep.participantId === currentParticipant?.id);
                    return (
                      <div key={expense.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">{expense.description}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                expense.splitType === 'EQUAL'
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                              }`}>
                                {expense.splitType === 'EQUAL' ? 'Equitativo' : 'Personalizado'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-bold text-base text-gray-900 dark:text-white">{sym}{expense.amount.toLocaleString()} {expense.currency}</span>
                              <span>💳 {payer?.name || payer?.email || '?'}</span>
                              <span>📅 {formatDateShort(new Date(expense.expenseDate))}</span>
                              <span>👥 {expense.participants.length}p</span>
                            </div>
                            {share && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
                                Tu parte: {sym}{share.amount.toLocaleString('es-CL', { maximumFractionDigits: 0 })} {expense.currency}
                              </p>
                            )}
                          </div>
                          <button onClick={() => handleDeleteExpense(expense.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors shrink-0">✕</button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Settlement section */}
            {trip.expenses.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Liquidación — Quién le debe a quién
                </h3>

                {settlements.length === 0 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold">¡Todo está al día! 🎉</p>
                    <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-1">No hay deudas pendientes entre los participantes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {settlements.map((s, i) => {
                      const sym = CURRENCY_SYMBOLS[s.currency as keyof typeof CURRENCY_SYMBOLS] || '';
                      const isMe = s.fromId === currentParticipant?.id;
                      const owesMe = s.toId === currentParticipant?.id;
                      const canPay = isMe || owesMe || isAdmin;
                      return (
                        <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${
                          isMe ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' :
                          owesMe ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' :
                          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`font-semibold ${isMe ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{s.fromName}</span>
                              <span className="text-gray-400">→</span>
                              <span className={`font-semibold ${owesMe ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{s.toName}</span>
                            </div>
                            {isMe && <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Debes pagar</p>}
                            {owesMe && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Te van a pagar</p>}
                          </div>
                          <span className={`text-lg font-bold tabular-nums ${
                            isMe ? 'text-red-600 dark:text-red-400' :
                            owesMe ? 'text-emerald-600 dark:text-emerald-400' :
                            'text-gray-900 dark:text-white'
                          }`}>
                            {sym}{s.amount.toLocaleString('es-CL', { maximumFractionDigits: 0 })} {s.currency}
                          </span>
                          {canPay && (
                            <button
                              onClick={() => handleMarkAsPaid(s.fromId, s.toId, s.amount, s.currency)}
                              className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm shrink-0">
                              ✓ Pagado
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Payments history */}
                {trip.payments && trip.payments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Pagos realizados</h4>
                    <div className="space-y-2">
                      {[...trip.payments].sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).map((payment: any) => {
                        const sym = CURRENCY_SYMBOLS[payment.currency as keyof typeof CURRENCY_SYMBOLS] || '';
                        const isMyPayment = payment.fromParticipantId === currentParticipant?.id || payment.toParticipantId === currentParticipant?.id;
                        return (
                          <div key={payment.id} className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm shrink-0">✓</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                <span className="font-semibold">{payment.fromParticipant?.name}</span>
                                <span className="text-gray-400 mx-1.5">pagó a</span>
                                <span className="font-semibold">{payment.toParticipant?.name}</span>
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateShort(new Date(payment.paidAt))}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                              {sym}{payment.amount.toLocaleString('es-CL', { maximumFractionDigits: 0 })} {payment.currency}
                            </span>
                            {(isMyPayment || isAdmin) && (
                              <button onClick={() => handleUndoPayment(payment.id)}
                                className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors shrink-0" title="Deshacer pago">
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Balances per participant */}
                {expCurrencies.map((currency) => (
                  <div key={currency}>
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{currency} — Balance por persona</h4>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                      {balancesPerCurrency[currency]
                        ?.filter((b) => b.paid > 0 || b.owes > 0)
                        .sort((a, b) => b.balance - a.balance)
                        .map((b, i) => {
                          const sym = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || '';
                          const isPositive = b.balance > 0.005;
                          const isNegative = b.balance < -0.005;
                          return (
                            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {b.name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.name}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  Pagó {sym}{b.paid.toLocaleString('es-CL', { maximumFractionDigits: 0 })} · Debe {sym}{b.owes.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                </p>
                              </div>
                              <span className={`text-sm font-bold tabular-nums ${
                                isPositive ? 'text-emerald-600 dark:text-emerald-400' :
                                isNegative ? 'text-red-500 dark:text-red-400' :
                                'text-gray-400 dark:text-gray-500'
                              }`}>
                                {isPositive ? '+' : ''}{sym}{b.balance.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PARTICIPANTES ── */}
        {activeTab === 'participantes' && (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button onClick={() => { setShowInviteForm(!showInviteForm); setInviteError(''); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                  {showInviteForm ? '✕ Cancelar' : '+ Invitar participante'}
                </button>
              </div>
            )}
            {showInviteForm && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Invitar al viaje</h3>
                <form onSubmit={handleInvite} className="space-y-3">
                  <input type="text" placeholder="Email (usuario registrado) o nombre (fantasma)" value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)} required
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as TripRole)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={TripRole.VIEWER}>Visualizador — solo lectura</option>
                    <option value={TripRole.EDITOR}>Editor — puede agregar contenido</option>
                    <option value={TripRole.ADMIN}>Admin — control total</option>
                  </select>
                  {inviteError && <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>}
                  <button type="submit" disabled={inviteSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                    {inviteSubmitting ? 'Invitando...' : 'Agregar'}
                  </button>
                </form>
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {trip.participants.length} {trip.participants.length === 1 ? 'participante' : 'participantes'}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {trip.participants.map((p: any) => {
                  const isMe = p.user?.email === session?.user?.email;
                  const roleColors: Record<string, string> = {
                    ADMIN: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
                    EDITOR: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                    VIEWER: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  };
                  return (
                    <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.user?.image
                          ? <img src={p.user.image} alt={p.name} className="w-9 h-9 rounded-full shrink-0 ring-2 ring-gray-100 dark:ring-gray-800" />
                          : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{p.name[0].toUpperCase()}</div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {p.name}{isMe && <span className="ml-1.5 text-xs text-gray-400 font-normal">(tú)</span>}
                          </p>
                          {p.user?.email && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.user.email}</p>}
                          {p.type === 'GHOST' && <p className="text-xs text-amber-500 dark:text-amber-400">👻 Fantasma</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && !isMe
                          ? <select value={p.role} onChange={(e) => handleRoleChange(p.id, e.target.value as TripRole)}
                              className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                              <option value={TripRole.VIEWER}>Visualizador</option>
                              <option value={TripRole.EDITOR}>Editor</option>
                              <option value={TripRole.ADMIN}>Admin</option>
                            </select>
                          : <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[p.role] || roleColors.VIEWER}`}>
                              {TRIP_ROLE_LABELS[p.role as keyof typeof TRIP_ROLE_LABELS]}
                            </span>
                        }
                        {isAdmin && !isMe && (
                          <button onClick={() => handleRemoveParticipant(p.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors text-sm">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ActivityCard({ activity, canEdit, onDelete }: { activity: any; canEdit: boolean; onDelete: (id: string) => void }) {
  const timeStr = activity.activityTime
    ? new Date(activity.activityTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <div className="group flex items-start gap-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="text-base mt-0.5 shrink-0">📍</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {timeStr && <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded shrink-0">{timeStr}</span>}
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{activity.title}</p>
        </div>
        {activity.location && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📌 {activity.location}</p>}
        {activity.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">{activity.notes}</p>}
      </div>
      {canEdit && (
        <button onClick={() => onDelete(activity.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">✕</button>
      )}
    </div>
  );
}

function EmptyState({ icon, text, subtext }: { icon: string; text: string; subtext?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-14 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{icon}</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">{text}</p>
      {subtext && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}
