import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../../utils/catchAsync";
import config from "../config";
import { UserModel } from "../modules/auth/auth.model";
import ApiError from "../../errors/ApiError";

const auth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;

    if (token?.startsWith("Bearer ")) token = token.slice(7);

    if (!token) {
        throw new ApiError(401, "Access denied. Please log in to continue.");
    }

    let decoded: jwt.JwtPayload;
    try {
        decoded = jwt.verify(token, config.jwt_access_secret as string) as { _id: string };
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            throw new ApiError(401, "Your session has expired. Please log in again.");
        }
        throw new ApiError(401, "Authentication failed. Please log in again.");
    }

    const user = await UserModel.findOne({ _id: decoded._id });

    if (!user) {
        throw new ApiError(404, "User account not found. Please sign up or log in again.");
    }

    if (!user.isActive) {
        throw new ApiError(401, "Your account is currently deactivated. Please contact support.");
    }

    if (user.role !== decoded?.role) {
        throw new ApiError(403, "Access denied. Please log in again with the correct account.");
    }

    req.user = user;
    next();
});

export default auth;
