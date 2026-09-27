import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/register", AuthController.registerPatient);
router.get("/login", AuthController.loginUser);

export const AuthRoutes = router;
