import { useEffect, useState } from "react";
import { uploadImage } from "../api/products";
import { apiError } from "../utils/format";
import { Banner, Field, buttonClass, inputClass } from "./ui";

const EMPTY = {
  name: "",
  category: "",
  farmer_name: "",
  description: "",
  price: "",
  available_quantity: "",
  image_url: "",
  status: "active",
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.category.trim()) errors.category = "Category is required.";
  if (!form.farmer_name.trim()) errors.farmer_name = "Farmer name is required.";
  const priceText = String(form.price).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(priceText) || Number(priceText) <= 0) {
    errors.price = "Price must be greater than 0, with up to 2 decimal places.";
  }
  if (!/^\d+$/.test(String(form.available_quantity).trim())) {
    errors.available_quantity = "Stock must be a whole number, 0 or more.";
  }
  if (form.image_url.trim() && !/^https?:\/\/.+/i.test(form.image_url.trim())) {
    errors.image_url = "Image must be an http(s) URL, or upload a file.";
  }
  if (form.status !== "active" && form.status !== "inactive") {
    errors.status = "Choose active or inactive.";
  }
  return errors;
}

export default function ProductForm({ initial, submitLabel, onSubmit, busy }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setForm({
      name: initial.name || "",
      category: initial.category || "",
      farmer_name: initial.farmer_name || "",
      description: initial.description || "",
      price: initial.price ?? "",
      available_quantity: initial.available_quantity ?? "",
      image_url: initial.image_url || "",
      status: initial.status || "active",
    });
  }, [initial]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setFormError("Upload a JPEG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    setFormError("");
    try {
      const data = await uploadImage(file);
      update("image_url", data.image_url);
    } catch (err) {
      setFormError(apiError(err, "Image upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setFormError("");
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category.trim(),
        farmer_name: form.farmer_name.trim(),
        description: form.description.trim() || null,
        price: String(form.price).trim(),
        available_quantity: Number(form.available_quantity),
        image_url: form.image_url.trim() || null,
        status: form.status,
      });
    } catch (err) {
      setFormError(apiError(err, "Could not save the product."));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Banner>{formError}</Banner>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Category" error={errors.category}>
          <input className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)} />
        </Field>
        <Field label="Farmer name" error={errors.farmer_name}>
          <input
            className={inputClass}
            value={form.farmer_name}
            onChange={(e) => update("farmer_name", e.target.value)}
          />
        </Field>
        <Field label="Status" error={errors.status}>
          <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Price (INR)" error={errors.price}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
          />
        </Field>
        <Field label="Available quantity" error={errors.available_quantity}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.available_quantity}
            onChange={(e) => update("available_quantity", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          className={inputClass}
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>
      <Field label="Image URL" error={errors.image_url}>
        <input
          className={inputClass}
          placeholder="https://"
          value={form.image_url}
          onChange={(e) => update("image_url", e.target.value)}
        />
      </Field>
      <Field label="Or upload an image">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} />
        {uploading ? <span className="mt-1 block text-sm text-stone-600">Uploading…</span> : null}
      </Field>
      {form.image_url ? (
        <img src={form.image_url} alt="" className="h-32 w-32 rounded-lg object-cover" />
      ) : null}
      <button className={buttonClass} type="submit" disabled={busy || uploading}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
