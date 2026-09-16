import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ICategory } from "./category.interface";
import { CategoryModel } from "./category.model";

const createCategory = async (payload: Partial<ICategory>) => {
    if (!payload.name) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required.");
    }

    const result = await CategoryModel.create(payload);
    return result;
};

const getAllCategories = async (query: Record<string, any> = {}) => {
    const { searchTerm, isActive, page = 1, limit = 10 } = query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: Record<string, any> = { isDeleted: false };

    if (isActive !== undefined && isActive !== "") {
        filter.isActive = isActive === "true" || isActive === true;
    }

    if (searchTerm) {
        filter.name = { $regex: searchTerm, $options: "i" };
    }

    const total = await CategoryModel.countDocuments(filter);
    const data = await CategoryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const totalPages = Math.ceil(total / limitNumber);

    return {
        data,
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
    };
};

const getSingleCategory = async (idOrSlug: string) => {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const filter = isObjectId
        ? { _id: idOrSlug, isDeleted: false }
        : { slug: idOrSlug, isDeleted: false };

    const result = await CategoryModel.findOne(filter);
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
    }

    return result;
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
    const category = await CategoryModel.findOne({ _id: id, isDeleted: false });
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    );

    return updatedCategory;
};

const deleteCategory = async (id: string) => {
    const category = await CategoryModel.findOne({ _id: id, isDeleted: false });
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
    }

    await CategoryModel.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    return null;
};

const getAdminCategories = async (query: Record<string, any> = {}) => {
    const { searchTerm, isActive, page = 1, limit = 10 } = query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: Record<string, any> = { isDeleted: false };

    if (isActive !== undefined && isActive !== "") {
        filter.isActive = isActive === "true" || isActive === true;
    }

    if (searchTerm) {
        filter.name = { $regex: searchTerm, $options: "i" };
    }

    const total = await CategoryModel.countDocuments(filter);
    const data = await CategoryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const totalPages = Math.ceil(total / limitNumber);

    return {
        data,
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
    };
};

const toggleCategoryStatus = async (id: string) => {
    const category = await CategoryModel.findOne({ _id: id, isDeleted: false });
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
        id,
        { $set: { isActive: !category.isActive } },
        { returnDocument: "after" },
    );

    return updatedCategory;
};

export const categoryServices = {
    createCategory,
    getAllCategories,
    getAdminCategories,
    getSingleCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
};
