import fs from "fs";
import path from "path";

/**
 * Remove array of image paths (relative or absolute) from the server file storage.
 * @param imagePaths Array of image path strings (e.g., ["/uploads/product-images/product-123.webp"])
 */
export const removeFiles = (imagePaths: string[] | string): void => {
    if (!imagePaths) return;
    const pathsArray = Array.isArray(imagePaths) ? imagePaths : [imagePaths];

    pathsArray.forEach((imgRelPath) => {
        if (!imgRelPath || typeof imgRelPath !== "string") return;

        // Remove leading slash if exists to join correctly with process.cwd()
        const cleanRelativePath = imgRelPath.startsWith("/") ? imgRelPath.slice(1) : imgRelPath;
        const fullPath = path.join(process.cwd(), cleanRelativePath);

        try {
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Successfully deleted file: ${fullPath}`);
            }
        } catch (err) {
            console.error(`Error deleting file at path ${fullPath}:`, err);
        }
    });
};
