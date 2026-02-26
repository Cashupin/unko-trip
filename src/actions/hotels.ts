'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { TripRole, Currency } from '@prisma/client';
import { calculateNights } from '@/lib/utils';

export async function createHotel(
  tripId: string,
  data: {
    name: string;
    link?: string;
    checkInDate: string;
    checkOutDate: string;
    pricePerNight?: number;
    totalPrice?: number;
    currency?: string;
    notes?: string;
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
      return { success: false, error: 'Viewers cannot add hotels' };
    }

    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);

    if (checkIn >= checkOut) {
      return { success: false, error: 'Check-out must be after check-in' };
    }

    const numberOfNights = calculateNights(checkIn, checkOut);

    const hotel = await prisma.hotel.create({
      data: {
        tripId,
        name: data.name,
        link: data.link,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        pricePerNight: data.pricePerNight ?? null,
        totalPrice: data.totalPrice ?? null,
        numberOfNights,
        currency: (data.currency || trip.defaultCurrency) as Currency,
        notes: data.notes,
      },
    });

    return { success: true, data: { id: hotel.id }, message: 'Hotel added' };
  } catch (error) {
    console.error('Error creating hotel:', error);
    return { success: false, error: 'Failed to create hotel' };
  }
}

export async function deleteHotel(hotelId: string): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        trip: { include: { participants: { include: { user: true } } } },
      },
    });

    if (!hotel) return { success: false, error: 'Hotel not found' };

    const participant = hotel.trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!participant || participant.role === TripRole.VIEWER) {
      return { success: false, error: 'Permission denied' };
    }

    await prisma.hotel.delete({ where: { id: hotelId } });

    return { success: true, message: 'Hotel deleted' };
  } catch (error) {
    console.error('Error deleting hotel:', error);
    return { success: false, error: 'Failed to delete hotel' };
  }
}
