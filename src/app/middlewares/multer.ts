import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

// Ensure upload directories exist
const profileImageDir = path.join(process.cwd(), "uploads", "profile-images");
const productImageDir = path.join(process.cwd(), "uploads", "product-images");
const customerServiceImageDir = path.join(process.cwd(), "uploads", "customer-service");
if (!fs.existsSync(profileImageDir)) fs.mkdirSync(profileImageDir, { recursive: true });
if (!fs.existsSync(productImageDir)) fs.mkdirSync(productImageDir, { recursive: true });
if (!fs.existsSync(customerServiceImageDir)) fs.mkdirSync(customerServiceImageDir, { recursive: true });

// Multer memory storage
const storage = multer.memoryStorage();

// File filter (only allow images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Image must be JPG, PNG, or WEBP"));
};

// Multer setup
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper to generate unique filename
const generateFileName = (prefix: string, originalName: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${randomNum}.webp`;
};

// Helper to get relative path for database
const getRelativeImagePath = (dirName: string, filename: string): string => {
    return `/uploads/${dirName}/${filename}`;
};

// Middleware for single profile image upload
export const uploadProfileImage = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single("profileImage");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process profileImage file if uploaded
        if (req.file) {
            try {
                const file = req.file;
                const newName = generateFileName("profile", file.originalname);
                const outputPath = path.join(profileImageDir, newName);

                // Convert to webp
                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                // Store the relative path instead of just filename
                file.filename = getRelativeImagePath("profile-images", newName);
                file.path = outputPath;
                file.mimetype = "image/webp";
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for multiple product images upload
export const uploadProductImages = (req: Request, res: Response, next: NextFunction) => {
    const uploadArray = upload.array("images", 3);

    uploadArray(req, res, async (err) => {
        if (err) return next(err);

        // Process images files if uploaded
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                for (const file of req.files) {
                    const newName = generateFileName("product", file.originalname);
                    const outputPath = path.join(productImageDir, newName);

                    // Convert to webp
                    await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                    // Store the relative path instead of just filename
                    file.filename = getRelativeImagePath("product-images", newName);
                    file.path = outputPath;
                    file.mimetype = "image/webp";
                }
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for multiple customer service images upload
export const uploadCustomerServiceImages = (req: Request, res: Response, next: NextFunction) => {
    const uploadArray = upload.array("images", 5);

    uploadArray(req, res, async (err) => {
        if (err) return next(err);

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                for (const file of req.files) {
                    const newName = generateFileName("service", file.originalname);
                    const outputPath = path.join(customerServiceImageDir, newName);

                    await sharp(file.buffer)
                        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toFile(outputPath);

                    file.filename = getRelativeImagePath("customer-service", newName);
                    file.path = outputPath;
                    file.mimetype = "image/webp";
                }
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};
