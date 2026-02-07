import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  X,
  Upload,
  AlertCircle,
} from 'lucide-react';
import {
  listServices,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
  type ServiceItem,
  type CreateServicePayload,
} from '../../services/service.service';
import { listCategories, type Category } from '../../services/category.service';

const ManageServices: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // modal state
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // form fields
  const [formData, setFormData] = useState<CreateServicePayload>({
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    duration: 30,
    image: '',
    serviceRadius: undefined,
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── fetch ─────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (catFilter) params.categoryId = catFilter;
      const res = await listServices(params);
      if (res.success) {
        setServices(res.data.services);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  }, [page, search, catFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    listCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, catFilter]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // ── image upload ──────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const result = await uploadServiceImage(file);
      setFormData((prev) => ({ ...prev, image: result.url }));
      setImagePreview(result.url);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to upload image' });
    } finally {
      setImageUploading(false);
    }
  };

  // ── open form ─────────────────────────────────────────
  const openAddForm = () => {
    setEditingService(null);
    setFormData({
      categoryId: '',
      name: '',
      description: '',
      price: 0,
      duration: 30,
      image: '',
      serviceRadius: undefined,
    });
    setImagePreview('');
    setShowForm(true);
  };

  const openEditForm = (svc: ServiceItem) => {
    setEditingService(svc);
    setFormData({
      categoryId: svc.categoryId,
      name: svc.name,
      description: svc.description || '',
      price: Number(svc.price),
      duration: svc.duration,
      image: svc.image || '',
      serviceRadius: svc.serviceRadius ?? undefined,
    });
    setImagePreview(svc.image || '');
    setShowForm(true);
  };

  // ── submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
        setFeedback({ type: 'success', message: 'Service updated successfully' });
      } else {
        await createService(formData);
        setFeedback({ type: 'success', message: 'Service created successfully' });
      }
      setShowForm(false);
      fetchServices();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to save service',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // ── toggle active ─────────────────────────────────────
  const handleToggleActive = async (svc: ServiceItem) => {
    setTogglingId(svc.id);
    try {
      await updateService(svc.id, { isActive: !svc.isActive });
      setFeedback({
        type: 'success',
        message: `Service ${svc.isActive ? 'deactivated' : 'activated'}`,
      });
      fetchServices();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update service' });
    } finally {
      setTogglingId(null);
    }
  };

  // ── delete ────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    setDeletingId(id);
    try {
      await deleteService(id);
      setFeedback({ type: 'success', message: 'Service deleted' });
      fetchServices();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete service' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage services on the platform</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <AlertCircle size={16} /> {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-orange-400 [&>option:checked]:bg-orange-500 [&>option:checked]:text-white"
          style={{ accentColor: '#f97316' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Layers size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No services found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first service to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {svc.image ? (
                            <img
                              src={svc.image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                              <Layers size={18} className="text-orange-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{svc.name}</p>
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                              {svc.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {svc.category?.name || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        Rs. {Number(svc.price).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{svc.duration} min</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            svc.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {svc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(svc)}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(svc)}
                            disabled={togglingId === svc.id}
                            title={svc.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                              svc.isActive ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {togglingId === svc.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : svc.isActive ? (
                              <ToggleRight size={18} />
                            ) : (
                              <ToggleLeft size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(svc.id)}
                            disabled={deletingId === svc.id}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
                          >
                            {deletingId === svc.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Service Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white [&>option:checked]:bg-orange-500 [&>option:checked]:text-white"
                  style={{ accentColor: '#f97316' }}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Pipe Repair"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of the service..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (Rs.) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="500"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.duration || ''}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, duration: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="30"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Image
                </label>
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 mb-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData((p) => ({ ...p, image: '' }));
                      }}
                      className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors">
                    {imageUploading ? (
                      <Loader2 size={24} className="animate-spin text-orange-400" />
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">Click to upload image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={imageUploading}
                    />
                  </label>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || imageUploading}
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {formLoading && <Loader2 size={16} className="animate-spin" />}
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
