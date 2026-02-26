'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { TripRole } from '@prisma/client';

export async function createActivity(
  tripId: string,
  data: {
    title: string;
    description?: string;
    location?: string;
    notes?: string;
    activityDate?: string;
    activityTime?: string;
  }
): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: { include: { user: true } } },
    });

    if (!trip) return { success: false, error: 'Trip not found' };

    const participant = trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!participant) return { success: false, error: 'Access denied' };

    if (participant.role === TripRole.VIEWER) {
      return { success: false, error: 'Viewers cannot add activities' };
    }

    const activity = await prisma.activity.create({
      data: {
        tripId,
        title: data.title,
        description: data.description,
        location: data.location,
        notes: data.notes,
        activityDate: data.activityDate ? new Date(data.activityDate) : null,
        activityTime: data.activityTime ? new Date(data.activityTime) : null,
      },
    });

    return { success: true, data: { id: activity.id }, message: 'Activity added' };
  } catch (error) {
    console.error('Error creating activity:', error);
    return { success: false, error: 'Failed to create activity' };
  }
}

export async function deleteActivity(activityId: string): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        trip: { include: { participants: { include: { user: true } } } },
      },
    });

    if (!activity) return { success: false, error: 'Activity not found' };

    const participant = activity.trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!participant || participant.role === TripRole.VIEWER) {
      return { success: false, error: 'Permission denied' };
    }

    await prisma.activity.delete({ where: { id: activityId } });

    return { success: true, message: 'Activity deleted' };
  } catch (error) {
    console.error('Error deleting activity:', error);
    return { success: false, error: 'Failed to delete activity' };
  }
}
