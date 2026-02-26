'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { Currency, SplitType, TripRole } from '@prisma/client';

export async function createExpense(
  tripId: string,
  data: {
    description: string;
    amount: number;
    currency: string;
    paidByParticipantId: string;
    expenseDate: string;
    splitType: 'EQUAL' | 'CUSTOM';
    /** IDs de participantes incluidos en la división */
    participantIds: string[];
    /** Solo para CUSTOM: monto por participante */
    customAmounts?: Record<string, number>;
  }
): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    // Verify membership and permission
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: { include: { user: true } } },
    });

    if (!trip) return { success: false, error: 'Viaje no encontrado' };

    const me = trip.participants.find((p) => p.user?.email === session.user?.email);
    if (!me) return { success: false, error: 'No eres miembro de este viaje' };
    if (me.role === TripRole.VIEWER) return { success: false, error: 'Los visualizadores no pueden registrar gastos' };

    if (data.participantIds.length === 0) {
      return { success: false, error: 'Debes incluir al menos un participante en la división' };
    }

    if (data.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    // Calculate per-person amounts
    let perPersonAmounts: Record<string, number>;

    if (data.splitType === 'EQUAL') {
      const share = data.amount / data.participantIds.length;
      perPersonAmounts = Object.fromEntries(data.participantIds.map((id) => [id, share]));
    } else {
      // CUSTOM: validate that amounts sum to total
      const total = Object.values(data.customAmounts || {}).reduce((a, b) => a + b, 0);
      if (Math.abs(total - data.amount) > 0.01) {
        return { success: false, error: `Los montos personalizados (${total}) no suman el total (${data.amount})` };
      }
      perPersonAmounts = data.customAmounts || {};
    }

    // Get user for createdById
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const expense = await prisma.expense.create({
      data: {
        tripId,
        createdById: user.id,
        paidByParticipantId: data.paidByParticipantId,
        description: data.description,
        amount: data.amount,
        currency: data.currency as Currency,
        expenseDate: new Date(data.expenseDate),
        splitType: data.splitType as SplitType,
        participants: {
          create: data.participantIds.map((pid) => ({
            participantId: pid,
            amount: Math.round((perPersonAmounts[pid] || 0) * 100) / 100,
          })),
        },
      },
    });

    return { success: true, data: { id: expense.id }, message: 'Gasto registrado' };
  } catch (error) {
    console.error('Error creating expense:', error);
    return { success: false, error: 'Error al registrar el gasto' };
  }
}

export async function deleteExpense(expenseId: string): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        trip: { include: { participants: { include: { user: true } } } },
        createdBy: true,
      },
    });

    if (!expense) return { success: false, error: 'Gasto no encontrado' };

    const me = expense.trip.participants.find((p) => p.user?.email === session.user?.email);
    if (!me) return { success: false, error: 'Acceso denegado' };

    // Only ADMIN or the creator can delete
    const isCreator = expense.createdBy.email === session.user.email;
    if (!isCreator && me.role !== TripRole.ADMIN) {
      return { success: false, error: 'Solo el creador o un admin pueden eliminar este gasto' };
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    return { success: true, message: 'Gasto eliminado' };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false, error: 'Error al eliminar el gasto' };
  }
}
