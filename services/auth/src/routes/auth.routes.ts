import { validateBody } from "@finflow/shared";
import { Router } from "express";
import { createUserSchema, loginSchema } from "../schemas";
import { registerUser } from "../controllers/registerUser.js";
import { verifyEmail } from "../controllers/emailVerification";
import { loginUser } from "../controllers/loginUser";

const router = Router();

router.post("/register", validateBody(createUserSchema), registerUser);
router.get("/verify-email", verifyEmail);
router.post("/login", validateBody(loginSchema), loginUser);

export default router;
