import { Router } from "express";
import {
  login,
  restoreLogin,
  loginEcomGoogle,
  restoreLoginEcom,
} from "../controllers/login.controller.js";
import authMiddle from "../middlewares/auth.middle.js";
import authPublicMiddle from "../middlewares/auth_public.middle.js";

const router = Router();

router.post("/", login);
router.post("/restore", authMiddle, restoreLogin);
router.post("/google", loginEcomGoogle);
router.post("/restore-ecom", authPublicMiddle, restoreLoginEcom);

export default router;
