'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { Currency, TripRole } from '@prisma/client';

/**
 * Register a payment between two participants (mark settlement as paid)
 */
export async function createPayment(
  tripId: string,
  data: {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    currency: string;
  }
): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: { include: { user: true } } },
    });

    if (!trip) return { success: false, error: 'Viaje no encontrado' };

    const me = trip.participants.find((p) => p.user?.email === session.user?.email);
    if (!me) return { success: false, error: 'No eres miembro de este viaje' };

    // Only ADMIN or the debtor (fromParticipant) can mark as paid
    const isDebtor = me.id === data.fromParticipantId;
    const isCreditor = me.id === data.toParticipantId;
    if (!isDebtor && !isCreditor && me.role !== TripRole.ADMIN) {
      return { success: false, error: 'Solo el deudor, el acreedor o un admin pueden registrar pagos' };
    }

    if (data.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    const payment = await prisma.payment.create({
      data: {
        tripId,
        fromParticipantId: data.fromParticipantId,
        toParticipantId: data.toParticipantId,
        amount: Math.round(data.amount * 100) / 100,
        currency: data.currency as Currency,
      },
    });

    return { success: true, data: { id: payment.id }, message: 'Pago registrado' };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: 'Error al registrar el pago' };
  }
}

/**
 * Delete a payment (undo)
 */
export async function deletePayment(paymentId: string): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        trip: { include: { participants: { include: { user: true } } } },
      },
    });

    if (!payment) return { success: false, error: 'Pago no encontrado' };

    const me = payment.trip.participants.find((p) => p.user?.email === session.user?.email);
    if (!me) return { success: false, error: 'Acceso denegado' };

    // Only ADMIN or the involved parties can undo
    const isInvolved = me.id === payment.fromParticipantId || me.id === payment.toParticipantId;
    if (!isInvolved && me.role !== TripRole.ADMIN) {
      return { success: false, error: 'Solo los involucrados o un admin pueden deshacer un pago' };
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    return { success: true, message: 'Pago deshecho' };
  } catch (error) {
    console.error('Error deleting payment:', error);
    return { success: false, error: 'Error al deshacer el pago' };
  }
}
