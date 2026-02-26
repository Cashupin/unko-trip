'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { TripRole } from '@prisma/client';
import { isValidEmail } from '@/lib/utils';

/**
 * Invite a participant to a trip
 * Can be registered user (by email) or ghost participant (by name)
 * Only ADMIN or EDITOR can invite
 */
export async function inviteParticipant(
  tripId: string,
  data: {
    emailOrName: string;
    role: TripRole;
  }
): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Check if user is ADMIN or EDITOR of the trip
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

    const userParticipant = trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!userParticipant) {
      return {
        success: false,
        error: 'You are not a member of this trip',
      };
    }

    if (userParticipant.role !== TripRole.ADMIN && userParticipant.role !== TripRole.EDITOR) {
      return {
        success: false,
        error: 'Only admins and editors can invite participants',
      };
    }

    // Determine if it's a registered user or ghost participant
    const isEmail = isValidEmail(data.emailOrName);

    if (isEmail) {
      // Registered user
      const invitedUser = await prisma.user.findUnique({
        where: { email: data.emailOrName },
      });

      if (!invitedUser) {
        return {
          success: false,
          error: 'User not found. Please share the invite link instead.',
        };
      }

      // Check if already a participant
      const existingParticipant = trip.participants.find(
        (p) => p.userId === invitedUser.id
      );

      if (existingParticipant) {
        return {
          success: false,
          error: 'User is already a participant in this trip',
        };
      }

      // Create participant
      const participant = await prisma.tripParticipant.create({
        data: {
          tripId,
          userId: invitedUser.id,
          name: invitedUser.name || invitedUser.email,
          type: 'REGISTERED',
          role: data.role,
        },
      });

      return {
        success: true,
        data: { id: participant.id },
        message: `${invitedUser.name || invitedUser.email} added to trip`,
      };
    } else {
      // Ghost participant
      const participant = await prisma.tripParticipant.create({
        data: {
          tripId,
          name: data.emailOrName,
          type: 'GHOST',
          role: data.role,
        },
      });

      return {
        success: true,
        data: { id: participant.id },
        message: `${data.emailOrName} added as ghost participant`,
      };
    }
  } catch (error) {
    console.error('Error inviting participant:', error);
    return {
      success: false,
      error: 'Failed to invite participant',
    };
  }
}

/**
 * Update participant role
 * Only ADMIN can change roles
 */
export async function updateParticipantRole(
  participantId: string,
  newRole: TripRole
): Promise<ApiResponse<null>> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const participant = await prisma.tripParticipant.findUnique({
      where: { id: participantId },
      include: {
        trip: {
          include: {
            participants: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!participant) {
      return {
        success: false,
        error: 'Participant not found',
      };
    }

    // Check if current user is ADMIN of the trip
    const adminParticipant = participant.trip.participants.find(
      (p) => p.user?.email === session.user?.email && p.role === TripRole.ADMIN
    );

    if (!adminParticipant) {
      return {
        success: false,
        error: 'Only admins can change participant roles',
      };
    }

    // Cannot demote the last admin
    const currentAdmins = participant.trip.participants.filter(
      (p) => p.role === TripRole.ADMIN
    );

    if (
      participant.role === TripRole.ADMIN &&
      currentAdmins.length === 1 &&
      newRole !== TripRole.ADMIN
    ) {
      return {
        success: false,
        error: 'Cannot demote the last admin. Assign another admin first.',
      };
    }

    // Update role
    await prisma.tripParticipant.update({
      where: { id: participantId },
      data: { role: newRole },
    });

    return {
      success: true,
      message: 'Participant role updated',
    };
  } catch (error) {
    console.error('Error updating participant role:', error);
    return {
      success: false,
      error: 'Failed to update participant role',
    };
  }
}

/**
 * Remove participant from trip
 * Only ADMIN can remove (except self-removal)
 */
export async function removeParticipant(
  participantId: string
): Promise<ApiResponse<null>> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const participant = await prisma.tripParticipant.findUnique({
      where: { id: participantId },
      include: {
        trip: {
          include: {
            participants: {
              include: { user: true },
            },
          },
        },
        user: true,
      },
    });

    if (!participant) {
      return {
        success: false,
        error: 'Participant not found',
      };
    }

    const currentUserParticipant = participant.trip.participants.find(
      (p) => p.user?.email === session.user?.email
    );

    if (!currentUserParticipant) {
      return {
        success: false,
        error: 'You are not a member of this trip',
      };
    }

    // Check permissions: Can be removed if user is admin OR if removing self
    const canRemove =
      currentUserParticipant.role === TripRole.ADMIN ||
      participant.user?.email === session.user?.email;

    if (!canRemove) {
      return {
        success: false,
        error: 'You do not have permission to remove this participant',
      };
    }

    // Cannot remove the last admin
    if (participant.role === TripRole.ADMIN) {
      const adminCount = participant.trip.participants.filter(
        (p) => p.role === TripRole.ADMIN
      ).length;

      if (adminCount === 1) {
        return {
          success: false,
          error: 'Cannot remove the last admin from the trip',
        };
      }
    }

    // Remove participant
    await prisma.tripParticipant.delete({
      where: { id: participantId },
    });

    return {
      success: true,
      message: 'Participant removed from trip',
    };
  } catch (error) {
    console.error('Error removing participant:', error);
    return {
      success: false,
      error: 'Failed to remove participant',
    };
  }
}
