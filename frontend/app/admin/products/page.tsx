'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { apiRequest, buildQuery, formatBDT } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminNav } from '@/components/AdminNav';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { Skeleton } from '@/components/EmptyState';
import type { Category, Product, ProductListResponse } from '@/lib/types';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  careInstructions: '',
  price: '',
  stock: '',
  imageUrl: '',
  categoryId: '',
  isFeatured: false,
};

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const load = async () => {
    try {
      const query = buildQuery({
        search: search || undefined,
        category: categoryFilter || undefined,
        includeArchived: true,
        limit: 100,
      });
      const data = await apiRequest<ProductListResponse>(`/admin/products${query}`);
      setProducts(data.items);
      setTotal(data.total);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not load products.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? '',
    });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      careInstructions: product.careInstructions ?? '',
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? '',
      categoryId: product.categoryId,
      isFeatured: product.isFeatured,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);

    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        careInstructions: form.careInstructions.trim() || undefined,
        price: Number(form.price),
        stock: Number(form.stock),
        imageUrl: form.imageUrl.trim() || undefined,
        categoryId: form.categoryId,
        isFeatured: form.isFeatured,
      };

      if (editing) {
        await apiRequest(`/admin/products/${editing.id}`, {
          method: 'PATCH',
          body,
        });
        setToast({ message: 'Product updated.', type: 'success' });
      } else {
        await apiRequest('/admin/products', { method: 'POST', body });
        setToast({ message: 'Product created.', type: 'success' });
      }

      setModalOpen(false);
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not save product.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/admin/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('gc_token')}`,
          },
          body: formData,
        },
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? 'Upload failed.');
      }

      // The API returns an absolute URL (Cloudinary secure_url), so it is
      // stored as-is. Relative paths are still prefixed with the API origin.
      const base =
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const origin = base.replace(/\/api\/v1\/?$/, '');
      const imageUrl = /^https?:\/\//i.test(payload.url)
        ? payload.url
        : `${origin}${payload.url}`;
      setForm((current) => ({
        ...current,
        imageUrl,
      }));
      setToast({ message: 'Image uploaded.', type: 'success' });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Upload failed.',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleArchive = async (product: Product) => {
    if (!window.confirm(`Archive "${product.name}"?`)) return;

    try {
      await apiRequest(`/admin/products/${product.id}`, { method: 'DELETE' });
      setToast({ message: 'Product archived.', type: 'success' });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not archive.',
        type: 'error',
      });
    }
  };

  const handleRestore = async (product: Product) => {
    try {
      await apiRequest(`/admin/products/${product.id}/restore`, { method: 'POST' });
      setToast({ message: 'Product restored.', type: 'success' });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not restore.',
        type: 'error',
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !window.confirm(
        `Permanently delete "${product.name}"? This only works if it has never been ordered.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/admin/products/${product.id}/permanent`, {
        method: 'DELETE',
      });
      setToast({ message: 'Product deleted.', type: 'success' });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not delete.',
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminNav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} product{total === 1 ? '' : 's'} in the catalogue.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          + New product
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products…"
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={product.isArchived ? 'bg-gray-50 opacity-60' : ''}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-emerald-50">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            🌿
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {product.name}
                          {product.isFeatured && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              Featured
                            </span>
                          )}
                          {product.isArchived && (
                            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                              Archived
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-xs text-gray-400">
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {product.category.name}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {formatBDT(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock <= 0
                          ? 'font-medium text-red-600'
                          : product.stock <= 5
                            ? 'font-medium text-amber-600'
                            : 'text-gray-600'
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                      {product.isArchived ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(product)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleArchive(product)}
                          className="text-xs font-medium text-amber-600 hover:underline"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit product' : 'New product'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={busy}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="p-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="p-name"
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="p-category"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="p-category"
                required
                value={form.categoryId}
                onChange={(event) =>
                  setForm({ ...form, categoryId: event.target.value })
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="p-price"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Price (BDT) <span className="text-red-500">*</span>
              </label>
              <input
                id="p-price"
                type="number"
                required
                min={0}
                step="1"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="p-stock"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                id="p-stock"
                type="number"
                required
                min={0}
                step="1"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="p-slug"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Slug
              </label>
              <input
                id="p-slug"
                type="text"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="generated from the name"
                className="h-11 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="p-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="p-description"
              required
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="p-care"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Care instructions
            </label>
            <textarea
              id="p-care"
              rows={3}
              value={form.careInstructions}
              onChange={(event) =>
                setForm({ ...form, careInstructions: event.target.value })
              }
              placeholder="Watering, light and feeding guidance shown on the product page."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="p-image"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                id="p-image"
                type="url"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm({ ...form, imageUrl: event.target.value })
                }
                placeholder="https://…"
                className="h-11 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {uploading ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {form.imageUrl && (
              <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={form.imageUrl}
                  alt="Preview"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                setForm({ ...form, isFeatured: event.target.checked })
              }
              className="h-4 w-4 accent-emerald-700"
            />
            Show on the homepage as a featured product
          </label>
        </form>
      </Modal>

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <RequireAuth adminOnly>
      <ProductsContent />
    </RequireAuth>
  );
}
