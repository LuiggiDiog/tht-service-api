import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from "../src/controllers/stores.controller";

const store = {
  name: "Tienda de Prueba",
  domain: "https://tienda.com",
  config: {},
};

describe("Stores Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      exec: jest.fn(),
    };
    res = {
      resp: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("getStores: debe obtener solo stores activas", async () => {
    req.exec.mockResolvedValue({ rows: [store] });
    await getStores(req, res);
    expect(req.exec).toHaveBeenCalledWith(
      "SELECT * FROM stores WHERE status = 'active'"
    );
    expect(res.resp).toHaveBeenCalledWith([store]);
  });

  test("getStore: debe obtener un store por ID si está activo", async () => {
    req.params.id = 1;
    req.exec.mockResolvedValue({ rows: [store] });
    await getStore(req, res);
    expect(req.exec).toHaveBeenCalledWith(
      "SELECT * FROM stores WHERE id = $1 AND status = 'active'",
      [1]
    );
    expect(res.resp).toHaveBeenCalledWith(store);
  });

  test("createStore: éxito crea un nuevo store y responde con el objeto", async () => {
    req.body = store;
    req.exec.mockResolvedValue({ rows: [store] });
    await createStore(req, res);
    expect(req.exec).toHaveBeenCalledWith(
      "INSERT INTO stores (name, domain, config) VALUES ($1, $2, $3) RETURNING *",
      [store.name, store.domain, store.config]
    );
    expect(res.resp).toHaveBeenCalledWith(store);
  });

  test("createStore: falla validación y lanza BE005", async () => {
    req.body = { name: "Tienda de Prueba" };
    await expect(createStore(req, res)).rejects.toBe("BE005");
    expect(req.exec).not.toHaveBeenCalled();
  });

  test("updateStore: éxito actualiza store existente", async () => {
    req.params.id = 1;
    req.body = store;
    req.exec.mockResolvedValue({ rows: [store] });
    await updateStore(req, res);
    expect(req.exec).toHaveBeenCalledWith(
      "UPDATE stores SET name = $1, domain = $2, config = $3 WHERE id = $4 RETURNING *",
      [store.name, store.domain, store.config, 1]
    );
    expect(res.resp).toHaveBeenCalledWith(store);
  });

  test("deleteStore: soft‑delete marca status = deleted y responde store", async () => {
    req.params.id = 1;
    req.exec.mockResolvedValue({ rows: [store] });
    await deleteStore(req, res);
    expect(req.exec).toHaveBeenCalledWith(
      "UPDATE stores SET status = 'deleted' WHERE id = $1 RETURNING *",
      [1]
    );
    expect(res.resp).toHaveBeenCalledWith(store);
  });
});
