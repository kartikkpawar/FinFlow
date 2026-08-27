import { validateBody } from "@finflow/shared";
import { Router } from "express";
import { createUserSchema, loginSchema } from "../schemas";
import { registerUser } from "../controllers/registerUser.js";
import { verifyEmail } from "../controllers/emailVerification";
import { loginUser } from "../controllers/loginUser";
import { refreshAccessToken } from "../controllers/refreshAccessToken";
import { logout } from "../controllers/logout";

const router = Router();

router.post("/register", validateBody(createUserSchema), registerUser);
router.get("/verify-email", verifyEmail);
router.post("/login", validateBody(loginSchema), loginUser);
router.post("/refresh-access-token", refreshAccessToken);
router.get("/logout", logout);

export default router;
