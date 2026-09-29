import client from "./client";

export async function checkout(payload) {
  const { data } = await client.post("/api/orders/checkout", payload);
  return data;
}

export async function fetchOrders() {
  const { data } = await client.get("/api/orders");
  return data;
}

export async function fetchOrder(id) {
  const { data } = await client.get(`/api/orders/${id}`);
  return data;
}
