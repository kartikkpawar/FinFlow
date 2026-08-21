import { validateBody } from "@finflow/shared";
import { Router } from "express";
import { createUserSchema } from "../schemas";
import { registerUser } from "../controllers/registerUser.js";

const router = Router();

router.post("/register", validateBody(createUserSchema), registerUser);

export default router;
