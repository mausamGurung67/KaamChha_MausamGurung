import cloudinary, { UploadApiResponse, UploadApiErrorResponse } from '../config/cloudinary';

export const uploadImage = async (filePath: string, folder?: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder || 'home-service',
  });
  return result.secure_url;
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export const uploadFromBuffer = async (
  buffer: Buffer,
  folder?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folder || 'home-service',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) reject(error);
          else resolve({ url: result!.secure_url, publicId: result!.public_id });
        }
      )
      .end(buffer);
  });
};

