import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, X, ImagePlus, MapPin } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import MapPicker from '../../components/common/MapPicker';
import type { LatLng } from '../../components/common/MapPicker';
import { createServiceRequest } from '../../services/serviceRequest.service';
import { listCategories, type Category } from '../../services/category.service';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { validateMinLength, validateRequired, validatePositiveNumber, type FieldErrors } from '../../utils/validator';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;

const PostServiceRequest: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState<LatLng | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    preferredDate: '',
    preferredTime: '',
  });

  useEffect(() => {
    listCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle location from map
  const handleLocationSelect = (latlng: LatLng, address: string) => {
    setMapPosition(latlng);
    setForm((prev) => ({
      ...prev,
      location: address.split(',').slice(0, 3).join(', '),
      latitude: latlng.lat,
      longitude: latlng.lng,
    }));
  };

  // Handle image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    // Show local previews immediately
    const previews = filesToUpload.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...previews]);

    setUploadingImages(true);
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post(
          `${API_ENDPOINTS.UPLOAD.IMAGE}?folder=service-requests`,
          formData
        );
        return res.data.data.url as string;
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
    } catch {
      toast.error('Failed to upload images');
      // Remove failed previews
      setImagePreviews((prev) => prev.slice(0, prev.length - filesToUpload.length));
    } finally {
      setUploadingImages(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors = {};

    const titleErr = validateMinLength(form.title, 3, 'Title');
    if (titleErr) errors.title = titleErr;

    const descErr = validateMinLength(form.description, 10, 'Description');
    if (descErr) errors.description = descErr;

    const catErr = validateRequired(form.category, 'Category');
    if (catErr) errors.category = catErr;

    const locErr = validateRequired(form.location, 'Location');
    if (locErr) errors.location = locErr;

    if (form.budget) {
      const budgetErr = validatePositiveNumber(form.budget, 'Budget');
      if (budgetErr) errors.budget = budgetErr;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        ...(form.budget ? { budget: parseFloat(form.budget) } : {}),
        ...(form.latitude !== undefined ? { latitude: form.latitude } : {}),
        ...(form.longitude !== undefined ? { longitude: form.longitude } : {}),
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
        ...(form.preferredDate ? { preferredDate: form.preferredDate } : {}),
        ...(form.preferredTime ? { preferredTime: form.preferredTime } : {}),
      };

      await createServiceRequest(payload);
      toast.success('Service request posted successfully!');
      navigate('/my-service-requests');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post service request');
    } finally {
      setSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Post a Service Request</h1>
            <p className="text-gray-500 mt-2">
              Can't find the service you need? Describe what you're looking for and
              let technicians come to you.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={(e) => {
                  handleChange(e);
                  if (fieldErrors.title) setFieldErrors(prev => { const n = { ...prev }; delete n.title; return n; });
                }}
                onBlur={() => {
                  const err = validateMinLength(form.title, 3, 'Title');
                  setFieldErrors(prev => { const n = { ...prev }; if (err) n.title = err; else delete n.title; return n; });
                }}
                placeholder="e.g. Fix leaky kitchen faucet"
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.title ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm`}
                required
              />
              {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={(e) => {
                  handleChange(e);
                  if (fieldErrors.description) setFieldErrors(prev => { const n = { ...prev }; delete n.description; return n; });
                }}
                onBlur={() => {
                  const err = validateMinLength(form.description, 10, 'Description');
                  setFieldErrors(prev => { const n = { ...prev }; if (err) n.description = err; else delete n.description; return n; });
                }}
                placeholder="Describe the issue or service you need in detail..."
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.description ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm resize-none`}
                required
              />
              {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Photos <span className="text-gray-400 font-normal">— optional, up to {MAX_IMAGES}</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">Upload photos to help technicians understand the issue better</p>

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={12} />
                      </button>
                      {/* Show loading overlay if URL not yet available */}
                      {!imageUrls[i] && uploadingImages && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 size={18} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {imageUrls.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 text-gray-500 hover:text-orange-500 transition text-sm disabled:opacity-50"
                >
                  {uploadingImages ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  {uploadingImages ? 'Uploading...' : 'Add Photos'}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={(e) => {
                  handleChange(e);
                  if (fieldErrors.category) setFieldErrors(prev => { const n = { ...prev }; delete n.category; return n; });
                }}
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.category ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm bg-white`}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <p className="text-red-500 text-xs mt-1">{fieldErrors.category}</p>}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Budget (NPR) <span className="text-gray-400 font-normal">— optional</span>
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => {
                  handleChange(e);
                  if (fieldErrors.budget) setFieldErrors(prev => { const n = { ...prev }; delete n.budget; return n; });
                }}
                onBlur={() => {
                  if (form.budget) {
                    const err = validatePositiveNumber(form.budget, 'Budget');
                    setFieldErrors(prev => { const n = { ...prev }; if (err) n.budget = err; else delete n.budget; return n; });
                  }
                }}
                placeholder="e.g. 1500"
                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.budget ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm`}
              />
              {fieldErrors.budget && <p className="text-red-500 text-xs mt-1">{fieldErrors.budget}</p>}
            </div>

            {/* Preferred Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Preferred Date <span className="text-gray-400 font-normal">— optional</span>
                </label>
                <input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  min={today}
                  value={form.preferredDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                />
              </div>
              <div>
                <label htmlFor="preferredTime" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Preferred Time <span className="text-gray-400 font-normal">— optional</span>
                </label>
                <input
                  id="preferredTime"
                  name="preferredTime"
                  type="time"
                  value={form.preferredTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={(e) => {
                    handleChange(e);
                    if (fieldErrors.location) setFieldErrors(prev => { const n = { ...prev }; delete n.location; return n; });
                  }}
                  placeholder="e.g. Itahari-13, Sunsari"
                  className={`flex-1 px-4 py-3 rounded-xl border ${fieldErrors.location ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition border ${
                    showMap
                      ? 'bg-orange-50 border-orange-300 text-orange-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapPin size={16} />
                  Map
                </button>
              </div>

              {/* Map Picker */}
              {showMap && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <MapPicker
                    position={mapPosition}
                    onLocationSelect={handleLocationSelect}
                    height="280px"
                  />
                </div>
              )}
              {fieldErrors.location && <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/30 hover:shadow-xl"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Post Service Request
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostServiceRequest;
