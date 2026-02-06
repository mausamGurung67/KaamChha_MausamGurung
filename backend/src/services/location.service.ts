import prisma from '../config/database';
import { calculateDistance, isWithinRadius } from '../utils/distance.util';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const updateUserLocation = async (
  userId: string,
  location: LocationData
): Promise<void> => {
  await prisma.profile.upsert({
    where: { userId },
    update: {
      latitude: location.latitude,
      longitude: location.longitude,
      lastLocationUpdate: new Date(),
    },
    create: {
      userId,
      latitude: location.latitude,
      longitude: location.longitude,
      lastLocationUpdate: new Date(),
    },
  });

  // Save to location history
  const locationHistory = await prisma.locationHistory.create({
    data: {
      userId,
      latitude: location.latitude,
      longitude: location.longitude,
    },
  });

  // TODO: Emit real-time location update (socket service not implemented)
  // emitLocationUpdate(userId, {
  //   userId,
  //   latitude: location.latitude,
  //   longitude: location.longitude,
  //   timestamp: locationHistory.timestamp,
  // });
};

export const findNearbyTechnicians = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<any[]> => {
  const technicians = await prisma.user.findMany({
    where: {
      role: 'TECHNICIAN',
      isActive: true,
      profile: {
        latitude: { not: null },
        longitude: { not: null },
      },
    },
    include: {
      profile: true,
      kyc: true,
    },
  });

  const nearbyTechnicians = technicians
    .filter((tech: typeof technicians[number]) => {
      if (!tech.profile?.latitude || !tech.profile?.longitude) return false;
      return isWithinRadius(
        latitude,
        longitude,
        tech.profile.latitude,
        tech.profile.longitude,
        radiusKm
      );
    })
    .map((tech: typeof technicians[number]) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        tech.profile!.latitude!,
        tech.profile!.longitude!
      );
      return {
        ...tech,
        distance: Math.round(distance * 100) / 100,
      };
    })
    .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

  return nearbyTechnicians;
};

export const getLocationHistory = async (
  userId: string,
  limit: number = 50
): Promise<any[]> => {
  return prisma.locationHistory.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};

