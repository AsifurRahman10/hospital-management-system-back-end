import { Router } from "express";
import { specialtyController } from "./specialty.controller";

const route = Router();

route.post("/", specialtyController.createSpecialty);
route.get("/", specialtyController.getAllSpecialty);
route.get("/:id", specialtyController.getSingleSpecialty);
route.patch("/:id", specialtyController.updateSpecialty);
route.delete("/:id", specialtyController.deleteSpecialty);

export const specialtyRoutes = route;
