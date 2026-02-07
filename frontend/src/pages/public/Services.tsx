import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { listServices, type ServiceItem } from '../../services/service.service';
import { listCategories, type Category } from '../../services/category.service';

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (catFilter) params.categoryId = catFilter;
      const res = await listServices(params);
      if (res.success) {
        setServices(res.data.services);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // silent
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-10 px-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Browse our wide range of home services. Book a trusted technician in just a few clicks.
          </p>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Service grid */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20">
              <Layers size={56} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">No services found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services.map((svc) => (
                  <Link
                    key={svc.id}
                    to={`/services/${svc.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {svc.image ? (
                        <img
                          src={svc.image}
                          alt={svc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers size={40} className="text-gray-300" />
                        </div>
                      )}
                      {/* Category badge */}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-3 py-1 rounded-full shadow-sm">
                        {svc.category?.name}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-orange-500 transition-colors">
                        {svc.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {svc.description || 'No description available'}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock size={14} />
                          <span>{svc.duration} min</span>
                        </div>
                        <p className="text-orange-500 font-bold text-lg">
                          Rs. {Number(svc.price).toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {svc.creator?.profile?.avatar ? (
                            <img
                              src={svc.creator.profile.avatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">
                              {(
                                svc.creator?.profile?.name ||
                                svc.creator?.email ||
                                'U'
                              )[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs text-gray-400">
                            {svc.creator?.profile?.name || 'Admin'}
                          </span>
                        </div>
                        <span className="text-orange-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          View <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Services;
