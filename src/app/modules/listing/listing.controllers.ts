import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { listingServices } from "./listing.services";

const createListing = catchAsync(async (req: Request, res: Response) => {
    let bodyData = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch (e) {
            // keep req.body as is if parse fails
        }
    }

    const hostId = (req as any).user._id;
    const files = req.files as Express.Multer.File[];

    const result = await listingServices.createListing(hostId, bodyData, files);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Listing created successfully",
        data: result,
    });
});

const getAllListings = catchAsync(async (req: Request, res: Response) => {
    const result = await listingServices.getAllListings(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Listings retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAdminListings = catchAsync(async (req: Request, res: Response) => {
    const result = await listingServices.getAdminListings(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin listings retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getHostListings = catchAsync(async (req: Request, res: Response) => {
    const hostId = (req as any).user._id;
    const result = await listingServices.getHostListings(hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host listings retrieved successfully",
        data: result,
    });
});

const getSingleListing = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await listingServices.getSingleListing(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Listing details retrieved successfully",
        data: result,
    });
});

const updateListing = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const hostId = (req as any).user._id;

    let bodyData = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch (e) {
            // keep req.body as is if parse fails
        }
    }

    const files = req.files as Express.Multer.File[];
    const result = await listingServices.updateListing(id, hostId, bodyData, files);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Listing updated successfully",
        data: result,
    });
});

const toggleListingStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const hostId = (req as any).user._id;

    const result = await listingServices.toggleListingStatus(id, hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Listing status updated to ${result.isActive ? "active" : "inactive"}`,
        data: result,
    });
});

const deleteListing = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const hostId = (req as any).user._id;

    const result = await listingServices.deleteListing(id, hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const listingControllers = {
    createListing,
    getAllListings,
    getAdminListings,
    getHostListings,
    getSingleListing,
    updateListing,
    toggleListingStatus,
    deleteListing,
};
