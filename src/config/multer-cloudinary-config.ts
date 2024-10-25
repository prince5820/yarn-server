import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary-config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    const extension = file.originalname.split('.').pop().toLowerCase();
    const isImage = file.mimetype.startsWith("image/");

    return {
      folder: 'uploads',
      resource_type: isImage ? "image" : "raw", // Use "raw" for non-images
      format: extension,
    };
  },
});

export const upload = multer({ storage });