import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

// Ensure upload directories exist
const profileImageDir = path.join(process.cwd(), "uploads", "profile-images");
const productImageDir = path.join(process.cwd(), "uploads", "product-images");
const categoryImageDir = path.join(process.cwd(), "uploads", "category-images");
const customerServiceImageDir = path.join(process.cwd(), "uploads", "customer-service");
const userDocumentDir = path.join(process.cwd(), "uploads", "user-documents");
if (!fs.existsSync(profileImageDir)) fs.mkdirSync(profileImageDir, { recursive: true });
if (!fs.existsSync(productImageDir)) fs.mkdirSync(productImageDir, { recursive: true });
if (!fs.existsSync(categoryImageDir)) fs.mkdirSync(categoryImageDir, { recursive: true });
if (!fs.existsSync(customerServiceImageDir)) fs.mkdirSync(customerServiceImageDir, { recursive: true });
if (!fs.existsSync(userDocumentDir)) fs.mkdirSync(userDocumentDir, { recursive: true });

// Multer memory storage
const storage = multer.memoryStorage();

// File filter (only allow images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Image must be JPG, PNG, or WEBP"));
};

// File filter for user documents (images + PDF)
const userDocumentFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Document must be JPG, PNG, WEBP, or PDF"));
};

// Multer setup
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadDoc = multer({
    storage,
    fileFilter: userDocumentFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// Middleware for user profile image + documents upload
export const uploadUserFiles = (req: Request, res: Response, next: NextFunction) => {
    const uploadFields = uploadDoc.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "businessDocument", maxCount: 1 },
        { name: "governmentIssuedId", maxCount: 1 },
    ]);

    uploadFields(req, res, async (err) => {
        if (err) return next(err);

        if (req.files && !Array.isArray(req.files)) {
            const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] };

            try {
                // 1. Process profileImage
                if (filesMap["profileImage"]?.[0]) {
                    const file = filesMap["profileImage"][0];
                    const newName = generateFileName("profile", file.originalname);
                    const outputPath = path.join(profileImageDir, newName);
                    await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);
                    file.filename = getRelativeImagePath("profile-images", newName);
                }

                // 2. Process businessDocument
                if (filesMap["businessDocument"]?.[0]) {
                    const file = filesMap["businessDocument"][0];
                    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype === "application/pdf" ? ".pdf" : ".webp");
                    const newName = `bizdoc-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000)}${ext}`;
                    const outputPath = path.join(userDocumentDir, newName);

                    if (file.mimetype === "application/pdf") {
                        fs.writeFileSync(outputPath, file.buffer);
                    } else {
                        await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);
                    }
                    file.filename = getRelativeImagePath("user-documents", newName);
                }

                // 3. Process governmentIssuedId
                if (filesMap["governmentIssuedId"]?.[0]) {
                    const file = filesMap["governmentIssuedId"][0];
                    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype === "application/pdf" ? ".pdf" : ".webp");
                    const newName = `govid-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000)}${ext}`;
                    const outputPath = path.join(userDocumentDir, newName);

                    if (file.mimetype === "application/pdf") {
                        fs.writeFileSync(outputPath, file.buffer);
                    } else {
                        await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);
                    }
                    file.filename = getRelativeImagePath("user-documents", newName);
                }
            } catch (error) {
                return next(error);
            }
        } else if (req.file) {
            try {
                const file = req.file;
                const newName = generateFileName("profile", file.originalname);
                const outputPath = path.join(profileImageDir, newName);
                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);
                file.filename = getRelativeImagePath("profile-images", newName);
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for single profile image upload
export const uploadProfileImage = uploadUserFiles;

// Middleware for single category image upload
export const uploadCategoryImage = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single("image");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        if (req.file) {
            try {
                const file = req.file;
                const newName = generateFileName("category", file.originalname);
                const outputPath = path.join(categoryImageDir, newName);

                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                file.filename = getRelativeImagePath("category-images", newName);
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
