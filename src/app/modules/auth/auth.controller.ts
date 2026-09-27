import { Request, Response, NextFunction } from "express";
import catchAsync from "../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import sendResponse from "../../shared/sendResponse";

const registerPatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await AuthServices.registerPatient(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "All specialty retrieved",
      data: data,
    });
  },
);

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await AuthServices.loginUser(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Login successful",
      data: data,
    });
  },
);

export const AuthController = { registerPatient, loginUser };
