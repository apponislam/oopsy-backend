import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string({ message: "Category name is required" }).min(2, "Category name must be at least 2 characters"),
    isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
});
