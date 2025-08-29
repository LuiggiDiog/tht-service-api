import "dotenv/config";
import "express-async-errors";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import baseMiddle from "./middlewares/base.middle.js";
import { errHandlerAsyncModel } from "./utils/tryCatch.js";

import loginRouter from "./routers/login.router.js";
import storesRouter from "./routers/stores.router.js";
import usersRouter from "./routers/users.router.js";
import customersRouter from "./routers/customers.router.js";
import productsRouter from "./routers/products.router.js";
import productsPublicRouter from "./routers/products_public.router.js";
import categoriesRouter from "./routers/categories.router.js";
import productCategoriesRouter from "./routers/product_categories.router.js";
import ordersRouter from "./routers/orders.router.js";
import orderItemsRouter from "./routers/order_items.router.js";
import paymentsRouter from "./routers/payments.router.js";
import inventoryMovementsRouter from "./routers/inventory_movements.router.js";
import ticketsRouter from "./routers/tickets.router.js";
import ticketsPublicRouter from "./routers/tickets_public.router.js";
import authMiddle from "./middlewares/auth.middle.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ limit: "35mb", extended: true }));

app.use(baseMiddle);

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});
app.use("/login", loginRouter);
app.use("/stores", storesRouter);
app.use("/users", usersRouter);
app.use("/customers", customersRouter);
app.use("/products", authMiddle, productsRouter);
app.use("/categories", categoriesRouter);
app.use("/product_categories", productCategoriesRouter);
app.use("/orders", ordersRouter);
app.use("/order_items", orderItemsRouter);
app.use("/payments", paymentsRouter);
app.use("/inventory_movements", inventoryMovementsRouter);
app.use("/tickets", authMiddle, ticketsRouter);
app.use("/tickets-public", ticketsPublicRouter);

app.use("/products-public", productsPublicRouter);

app.use(errHandlerAsyncModel);

const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
