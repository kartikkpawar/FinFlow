import { validateBody } from "@finflow/shared";
import { Router } from "express";
import { createUserSchema } from "../schemas";
import { registerUser } from "../controllers/registerUser.js";
import { verifyEmail } from "../controllers/emailVerification";

const router = Router();

router.post("/register", validateBody(createUserSchema), registerUser);

router.get("/verify-email", verifyEmail);

export default router;
