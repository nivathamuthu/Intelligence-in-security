import client from "./client";

export async function getCart() {
  const { data } = await client.get("/api/cart");
  return data;
}

export async function addItem(payload) {
  const { data } = await client.post("/api/cart/items", payload);
  return data;
}

export async function updateItem(itemId, payload) {
  const { data } = await client.put(`/api/cart/items/${itemId}`, payload);
  return data;
}

export async function removeItem(itemId) {
  const { data } = await client.delete(`/api/cart/items/${itemId}`);
  return data;
}
