import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { categoryServices } from "./category.services";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    let bodyData: any = {};

    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch {
            bodyData = req.body;
        }
    } else {
        bodyData = req.body;
    }

    if (req.file) {
        bodyData.image = req.file.filename;
    }

    const result = await categoryServices.createCategory(bodyData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category created successfully",
        data: result,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await categoryServices.getAllCategories(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Categories retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await categoryServices.getSingleCategory(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category retrieved successfully",
        data: result,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    let bodyData: any = {};

    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch {
            bodyData = req.body;
        }
    } else {
        bodyData = req.body;
    }

    if (req.file) {
        bodyData.image = req.file.filename;
    }

    const result = await categoryServices.updateCategory(id, bodyData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category updated successfully",
        data: result,
    });
});

const getAdminCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await categoryServices.getAdminCategories(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin categories retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const toggleCategoryStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await categoryServices.toggleCategoryStatus(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Category status updated to ${result?.isActive ? "active" : "inactive"} successfully`,
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await categoryServices.deleteCategory(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category deleted successfully",
        data: null,
    });
});

export const categoryControllers = {
    createCategory,
    getAllCategories,
    getAdminCategories,
    getSingleCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
};
