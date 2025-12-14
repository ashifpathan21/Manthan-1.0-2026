// utils/uploadToCloudinary.ts
import cloudinary from "./cloudinary.js";
import path from "path";

type UploadSuccess = {
    success: true;
    url: string;
    publicId: string;
};

type UploadFailure = {
    success: false;
    error: string;
};

export type UploadResult = UploadSuccess | UploadFailure;

export async function uploadToCloudinary(
    filePath: string
): Promise<UploadResult> {
    try {
        const fileName = path.parse(filePath).name;

        const result = await cloudinary.uploader.upload(filePath, {
            folder: "resumes",
            resource_type: "raw",
            public_id: fileName,
            overwrite: true,
            format: "pdf",
            use_filename: true,
            unique_filename: false
        });

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (err: any) {
        return {
            success: false,
            error: err?.message || "Unknown Cloudinary error"
        };
    }
}



export async function deleteFromCloudinary(publicId: string) {
    await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw"
    });
}
