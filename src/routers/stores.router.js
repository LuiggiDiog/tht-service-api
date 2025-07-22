import { Router } from "express";
import {
  getStores,
  getStore,
  getStoreByDomain,
  getStoresByUser,
  createStore,
  updateStore,
  deleteStore,
} from "../controllers/stores.controller.js";

const router = Router();

router.get("/", getStores);
router.get("/:id", getStore);
router.get("/domain/:domain", getStoreByDomain);
router.get("/user/:userId", getStoresByUser);
/* router.post("/", createStore); */
router.put("/:id", updateStore);
/* router.delete("/:id", deleteStore); */

export default router;
