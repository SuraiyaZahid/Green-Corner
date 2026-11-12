'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminNav } from '@/components/AdminNav';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { Skeleton } from '@/components/EmptyState';
import type { Category } from '@/lib/types';

const EMPTY_FORM = { name: '', slug: '', description: '', imageUrl: '' };

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const load = async () => {
    try {
      setCategories(await apiRequest<Category[]>('/categories'));
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : 'Could not load categories.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      imageUrl: category.imageUrl ?? '',
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
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      };

      if (editing) {
        await apiRequest(`/admin/categories/${editing.id}`, {
          method: 'PATCH',
          body,
        });
        setToast({ message: 'Category updated.', type: 'success' });
      } else {
        await apiRequest('/admin/categories', { method: 'POST', body });
        setToast({ message: 'Category created.', type: 'success' });
      }

      setModalOpen(false);
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not save.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    try {
      await apiRequest(`/admin/categories/${category.id}`, { method: 'DELETE' });
      setToast({ message: 'Category deleted.', type: 'success' });
      await load();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : 'Could not delete the category.',
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminNav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organise the storefront navigation.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          + New category
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{category.name}</p>
                    {category.description && (
                      <p className="mt-0.5 max-w-md truncate text-xs text-gray-500">
                        {category.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {category.slug}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {category._count?.products ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No categories yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit category' : 'New category'}
        onClose={() => setModalOpen(false)}
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
              form="category-form"
              disabled={busy}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="cat-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="cat-slug"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Slug
            </label>
            <input
              id="cat-slug"
              type="text"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="generated from the name"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="cat-desc"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="cat-desc"
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
              htmlFor="cat-image"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Image URL
            </label>
            <input
              id="cat-image"
              type="url"
              value={form.imageUrl}
              onChange={(event) =>
                setForm({ ...form, imageUrl: event.target.value })
              }
              placeholder="https://…"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
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

export default function AdminCategoriesPage() {
  return (
    <RequireAuth adminOnly>
      <CategoriesContent />
    </RequireAuth>
  );
}
