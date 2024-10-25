import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary-config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads'
  } as Record<string, any>
})

export const upload = multer({ storage });