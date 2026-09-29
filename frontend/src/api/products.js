import client from "./client";

export async function fetchProducts({ search, category, admin = false } = {}) {
  const { data } = await client.get("/api/products", {
    params: {
      search: search || undefined,
      category: category || undefined,
      admin: admin ? true : undefined,
    },
  });
  return data;
}

export async function fetchCategories() {
  const { data } = await client.get("/api/products/categories");
  return data;
}

export async function fetchProduct(id, { admin = false } = {}) {
  const { data } = await client.get(`/api/products/${id}`, {
    params: { admin: admin ? true : undefined },
  });
  return data;
}

export async function createProduct(payload) {
  const { data } = await client.post("/api/products", payload);
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await client.put(`/api/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id) {
  await client.delete(`/api/products/${id}`);
}

export async function updateProductStatus(id, status) {
  const { data } = await client.patch(`/api/products/${id}/status`, { status });
  return data;
}

export async function updateProductStock(id, availableQuantity) {
  const { data } = await client.patch(`/api/products/${id}/stock`, {
    available_quantity: availableQuantity,
  });
  return data;
}

export async function uploadImage(file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await client.post("/api/products/upload", body);
  return data;
}
