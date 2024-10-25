import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary-config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    resource_type: "auto",
    format: async (req: any, file: any) => {
      const extension = file.originalname.split(".").pop();
      return extension; // Keeps original file extension
    },
  } as Record<string, any>
})

export const upload = multer({ storage });