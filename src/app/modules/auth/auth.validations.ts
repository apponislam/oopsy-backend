import { z } from "zod";

const locationSchema = z.object({
    type: z.literal("Point").default("Point"),
    coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

const addressSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    location: locationSchema.optional(),
});

const businessDetailsSchema = z.object({
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    companyRegistrationNumber: z.string().optional(),
    vatNumber: z.string().optional(),
});

export const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["SUPER_ADMIN", "CLIENT", "PROVIDER"]).default("CLIENT"),
    phone: z.string().optional(),
    profileImage: z.string().optional(),
    website: z.string().optional(),
    businessDocument: z.string().optional(),
    governmentIssuedId: z.string().optional(),
    address: z
        .string()
        .optional()
        .transform((val) => (val ? JSON.parse(val) : undefined))
        .pipe(addressSchema)
        .optional(),
    businessDetails: z
        .string()
        .optional()
        .transform((val) => (val ? JSON.parse(val) : undefined))
        .pipe(businessDetailsSchema)
        .optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const verifyEmailSchema = z.object({
    token: z.string(),
    email: z.string().email(),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    profileImage: z.string().optional(),
    website: z.string().optional(),
    businessDocument: z.string().optional(),
    governmentIssuedId: z.string().optional(),
    address: z
        .string()
        .optional()
        .transform((val) => (val ? JSON.parse(val) : undefined))
        .pipe(addressSchema)
        .optional(),
    businessDetails: z
        .string()
        .optional()
        .transform((val) => (val ? JSON.parse(val) : undefined))
        .pipe(businessDetailsSchema)
        .optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
});

export const updateEmailSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const resendEmailUpdateSchema = z.object({
    password: z.string(),
});
