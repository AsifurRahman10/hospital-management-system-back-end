import catchAsync from "../../shared/catchAsync";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { specialtyServices } from "./speciality.service";
import sendResponse from "../../shared/sendResponse";

const createSpecialty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const data = await specialtyServices.createSpecialty(payload);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Specialty created successfully",
      data: data,
    });
  },
);

const getAllSpecialty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await specialtyServices.getAllSpecialty();

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "All specialty retrieved",
      data: data,
    });
  },
);

const getSingleSpecialty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const data = await specialtyServices.getSingleSpecialty(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Specialty retrieved successfully",
      data: data,
    });
  },
);

const updateSpecialty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const payload = req.body;
    const data = await specialtyServices.updateSpecialty(id, payload);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Specialty updated successfully",
      data: data,
    });
  },
);

const deleteSpecialty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const data = await specialtyServices.deleteSpecialty(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Specialty deleted successfully",
      data: data,
    });
  },
);

export const specialtyController = {
  createSpecialty,
  getAllSpecialty,
  getSingleSpecialty,
  updateSpecialty,
  deleteSpecialty,
};
