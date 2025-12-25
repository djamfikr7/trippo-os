import { useMutation, useQuery } from '@tanstack/react-query';
import { uploadFile, deleteFile, getFileInfo } from '@/lib/s3-storage';

// Upload file mutation
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, options }: { file: File; options: any }) => {
      return await uploadFile(file, options);
    },
  });
}

// Delete file mutation
export function useDeleteFile() {
  return useMutation({
    mutationFn: async (key: string) => {
      return await deleteFile(key);
    },
  });
}

// Get file info query
export function useFileInfo(key: string) {
  return useQuery({
    queryKey: ['file-info', key],
    queryFn: () => getFileInfo(key),
    enabled: !!key,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get driver documents
export function useDriverDocuments(driverId: string) {
  return useQuery({
    queryKey: ['driver-documents', driverId],
    queryFn: async () => {
      // In production, this would fetch from database
      // For now, we'll return a mock result
      const { db } = await import('@/lib/db');
      const documents = await db.document.findMany({
        where: { driverId },
        select: {
          id: true,
          type: true,
          url: true,
          status: true,
          createdAt: true,
        },
      });

      return documents.map((doc) => ({
        ...doc,
        fileName: `${doc.type}_${doc.id}`,
        size: 0,
        mimeType: 'application/pdf',
      }));
    },
    enabled: !!driverId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Upload driver document
export function useUploadDriverDocument() {
  return useMutation({
    mutationFn: async ({ file, driverId, documentType }: { file: File; driverId: string; documentType: string }) => {
      // Upload file to S3
      const uploadedFile = await uploadFile(file, {
        folder: 'documents',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      });

      // Create document record in database
      const { db } = await import('@/lib/db');
      const document = await db.document.create({
        data: {
          driverId,
          type: documentType,
          url: uploadedFile.url,
          status: 'PENDING',
        },
      });

      return document;
    },
  });
}

// Upload avatar
export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      // Upload file to S3
      const uploadedFile = await uploadFile(file, {
        folder: 'avatars',
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      // Update user avatar
      const { db } = await import('@/lib/db');
      const user = await db.user.update({
        where: { id: userId },
        data: { avatar: uploadedFile.url },
      });

      return user;
    },
  });
}

// Upload vehicle image
export function useUploadVehicleImage() {
  return useMutation({
    mutationFn: async ({ file, driverId, imageType }: { file: File; driverId: string; imageType: string }) => {
      // Upload file to S3
      const uploadedFile = await uploadFile(file, {
        folder: 'vehicle-images',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      // Create vehicle image record in database
      const { db } = await import('@/lib/db');
      const vehicleImage = await db.vehicleImage.create({
        data: {
          driverId,
          type: imageType,
          url: uploadedFile.url,
        },
      });

      return vehicleImage;
    },
  });
}

// Delete driver document
export function useDeleteDriverDocument() {
  return useMutation({
    mutationFn: async ({ documentId, documentUrl }: { documentId: string; documentUrl: string }) => {
      // Delete from S3
      const key = documentUrl.split('/').pop() || '';
      await deleteFile(key);

      // Delete from database
      const { db } = await import('@/lib/db');
      await db.document.delete({
        where: { id: documentId },
      });

      return documentId;
    },
  });
}

// Verify document
export function useVerifyDocument() {
  return useMutation({
    mutationFn: async ({ documentId, action, notes }: { documentId: string; action: string; notes?: string }) => {
      const { db } = await import('@/lib/db');
      
      let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
      
      if (action === 'approve') {
        status = 'APPROVED';
      } else if (action === 'reject') {
        status = 'REJECTED';
      }

      const document = await db.document.update({
        where: { id: documentId },
        data: {
          status,
          notes,
          updatedAt: new Date(),
        },
      });

      // If approved, verify driver
      if (status === 'APPROVED') {
        const doc = await db.document.findUnique({
          where: { id: documentId },
          include: { driver: true },
        });

        if (doc && doc.driver) {
          // Check if driver has all required documents
          const requiredDocs = await db.document.count({
            where: {
              driverId: doc.driver.id,
              status: 'APPROVED',
            },
          });

          if (requiredDocs >= 3) {
            await db.driver.update({
              where: { id: doc.driver.id },
              data: { isVerified: true },
            });
          }
        }
      }

      return document;
    },
  });
}
