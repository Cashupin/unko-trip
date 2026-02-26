'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { Currency, TripRole } from '@prisma/client';
import { redirect } from 'next/navigation';

/**
 * Create a new trip
 * Only authenticated users can create trips (become ADMIN)
 */
export async function createTrip(
  data: {
    name: string;
    description?: string;
    destination?: string;
    startDate: Date;
    endDate: Date;
    defaultCurrency?: string;
  }
): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in first.',
      };
    }

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found. Please sign in again.',
      };
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      return {
        success: false,
        error: 'Start date must be before end date.',
      };
    }

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        name: data.name,
        description: data.description,
        destination: data.destination,
        startDate,
        endDate,
        defaultCurrency: (data.defaultCurrency || 'CLP') as any,
        createdById: user.id,
      },
    });

    // Add creator as ADMIN participant
    await prisma.tripParticipant.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        name: user.name || user.email,
        type: 'REGISTERED',
        role: TripRole.ADMIN,
      },
    });

    return {
      success: true,
      data: { id: trip.id },
      message: 'Trip created successfully',
    };
  } catch (error) {
    console.error('Error creating trip:', error);
    return {
      success: false,
      error: 'Failed to create trip. Please try again.',
    };
  }
}

/**
 * Get trip by ID with full relations
 */
export async function getTripById(tripId: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        createdBy: true,
        participants: {
          include: { user: true },
        },
        activities: true,
        hotels: true,
        expenses: {
          include: {
            createdBy: true,
            participants: {
              include: { participant: true },
            },
          },
        },
        payments: {
          include: {
            fromParticipant: true,
            toParticipant: true,
          },
        },
      },
    });

    if (!trip) {
      return {
        success: false,
        error: 'Trip not found',
      };
    }

    // Check if user has access to this trip
    const userParticipant = trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!userParticipant) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    return {
      success: true,
      data: trip,
    };
  } catch (error) {
    console.error('Error fetching trip:', error);
    return {
      success: false,
      error: 'Failed to fetch trip',
    };
  }
}

/**
 * Get all trips for current user
 */
export async function getUserTrips() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tripParticipations: {
          include: {
            trip: {
              include: {
                createdBy: true,
                participants: true,
              },
            },
          },
        },
        createdTrips: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Combine created trips and participated trips
    const allTrips = [
      ...user.createdTrips,
      ...user.tripParticipations.map((tp) => tp.trip),
    ];

    // Remove duplicates
    const uniqueTrips = Array.from(
      new Map(allTrips.map((trip) => [trip.id, trip])).values()
    );

    return {
      success: true,
      data: uniqueTrips,
    };
  } catch (error) {
    console.error('Error fetching user trips:', error);
    return {
      success: false,
      error: 'Failed to fetch trips',
    };
  }
}

/**
 * Update trip details (only ADMIN can edit)
 */
export async function updateTrip(
  tripId: string,
  data: {
    name: string;
    description?: string;
    destination?: string;
    startDate: Date;
    endDate: Date;
    defaultCurrency?: string;
  }
): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: { include: { user: true } } },
    });

    if (!trip) return { success: false, error: 'Viaje no encontrado' };

    const me = trip.participants.find((p) => p.user?.email === session.user?.email);
    if (!me || me.role !== TripRole.ADMIN) {
      return { success: false, error: 'Solo los admins pueden editar el viaje' };
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (startDate >= endDate) {
      return { success: false, error: 'La fecha de inicio debe ser anterior a la de término' };
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: {
        name: data.name,
        description: data.description,
        destination: data.destination,
        startDate,
        endDate,
        defaultCurrency: (data.defaultCurrency || 'CLP') as Currency,
      },
    });

    return { success: true, message: 'Viaje actualizado' };
  } catch (error) {
    console.error('Error updating trip:', error);
    return { success: false, error: 'Error al actualizar el viaje' };
  }
}

/**
 * Delete trip (only ADMIN can delete)
 */
export async function deleteTrip(tripId: string): Promise<ApiResponse<null>> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    if (!trip) {
      return {
        success: false,
        error: 'Trip not found',
      };
    }

    // Check if user is ADMIN
    const userParticipant = trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!userParticipant || userParticipant.role !== TripRole.ADMIN) {
      return {
        success: false,
        error: 'Only admins can delete trips',
      };
    }

    // Delete trip (cascade delete will handle related records)
    await prisma.trip.delete({
      where: { id: tripId },
    });

    return {
      success: true,
      message: 'Trip deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting trip:', error);
    return {
      success: false,
      error: 'Failed to delete trip',
    };
  }
}
