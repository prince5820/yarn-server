import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary-config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    const extension = file.originalname.split('.').pop().toLowerCase();

    let resourceType: string;
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else {
      resourceType = "raw";
    }

    return {
      folder: 'uploads',
      resource_type: resourceType,
      format: extension,
      upload_preset: 'vtcdef5l'
    };
  },
});

export const upload = multer({ storage });