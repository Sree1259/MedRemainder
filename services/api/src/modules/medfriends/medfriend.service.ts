import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';
import { generateInviteToken } from '@common/utils';

export const inviteMedfriend = async (
  patientId: string,
  data: {
    email: string;
    permissions?: { viewMeds: boolean; viewHealth: boolean };
    notifyOnMiss?: boolean;
  }
) => {
  // Check if already linked or pending
  const existing = await prisma.medfriendLink.findFirst({
    where: {
      patientId,
      inviteEmail: data.email,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
  });

  if (existing) {
    throw new AppError('Invitation already sent to this email', 409);
  }

  // Check medfriend limit for free users
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
      },
      _count: {
        select: {
          medfriendLinksAsPatient: {
            where: { status: 'ACCEPTED' },
          },
        },
      },
    },
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  const isPremium = patient.isPremium || patient.subscriptions.length > 0;
  
  if (!isPremium && patient._count.medfriendLinksAsPatient >= 1) {
    throw new AppError(
      'Free users can only have 1 MedFriend. Upgrade to premium for unlimited caregivers.',
      403
    );
  }

  const inviteToken = generateInviteToken();

  const link = await prisma.medfriendLink.create({
    data: {
      patientId,
      inviteEmail: data.email,
      inviteToken,
      status: 'PENDING',
      permissions: data.permissions || { viewMeds: true, viewHealth: false },
      notifyOnMiss: data.notifyOnMiss ?? true,
    },
  });

  // TODO: Send invitation email

  return link;
};

export const acceptInvitation = async (token: string, caregiverId: string) => {
  const link = await prisma.medfriendLink.findFirst({
    where: {
      inviteToken: token,
      status: 'PENDING',
    },
  });

  if (!link) {
    throw new AppError('Invalid or expired invitation', 404);
  }

  const updated = await prisma.medfriendLink.update({
    where: { id: link.id },
    data: {
      caregiverId,
      status: 'ACCEPTED',
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

export const getMyMedfriends = async (patientId: string) => {
  const links = await prisma.medfriendLink.findMany({
    where: {
      patientId,
      status: 'ACCEPTED',
    },
    include: {
      caregiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return links;
};

export const getPatientsICareFor = async (caregiverId: string) => {
  const links = await prisma.medfriendLink.findMany({
    where: {
      caregiverId,
      status: 'ACCEPTED',
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return links;
};

export const revokeMedfriend = async (patientId: string, linkId: string) => {
  const link = await prisma.medfriendLink.findFirst({
    where: {
      id: linkId,
      patientId,
    },
  });

  if (!link) {
    throw new AppError('Medfriend link not found', 404);
  }

  await prisma.medfriendLink.update({
    where: { id: linkId },
    data: { status: 'REVOKED' },
  });

  return { message: 'Medfriend access revoked' };
};
