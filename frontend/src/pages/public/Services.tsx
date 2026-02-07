import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
  ArrowRight,
  ChevronDown,
  Star,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { listServices, type ServiceItem } from '../../services/service.service';
import { listCategories, type Category } from '../../services/category.service';

const Services: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(searchParams.get('category') || '');
  const [priceSort, setPriceSort] = useState('');
  const [ratingSort, setRatingSort] = useState('');

  // Dropdowns open state
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (catFilter) params.categoryId = catFilter;
      if (priceSort === 'low') { params.minPrice = '0'; params.maxPrice = '500'; }
      if (priceSort === 'mid') { params.minPrice = '500'; params.maxPrice = '2000'; }
      if (priceSort === 'high') { params.minPrice = '2000'; }
      const res = await listServices(params);
      if (res.success) {
        setServices(res.data.services);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, catFilter, priceSort]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    listCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  // Sync URL category param
  useEffect(() => {
    const urlCat = searchParams.get('category');
    if (urlCat && urlCat !== catFilter) {
      setCatFilter(urlCat);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, catFilter, priceSort, ratingSort]);

  // Update URL when category changes
  const handleCategoryChange = (catId: string) => {
    setCatFilter(catId);
    setCatDropdownOpen(false);
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  const selectedCategoryName = categories.find(c => c.id === catFilter)?.name || 'Categories';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ========= SUB-NAVBAR: Search + Filters ========= */}
      <section className="pt-[72px] bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Services"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCatDropdownOpen(!catDropdownOpen); setPriceDropdownOpen(false); setRatingDropdownOpen(false); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                  catFilter ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {selectedCategoryName}
                <ChevronDown size={15} className={`transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {catDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition ${!catFilter ? 'text-orange-500 font-medium bg-orange-50/50' : 'text-gray-700'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCategoryChange(c.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition ${catFilter === c.id ? 'text-orange-500 font-medium bg-orange-50/50' : 'text-gray-700'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setPriceDropdownOpen(!priceDropdownOpen); setCatDropdownOpen(false); setRatingDropdownOpen(false); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                  priceSort ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Price
                <ChevronDown size={15} className={`transition-transform ${priceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {priceDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {[
                    { value: '', label: 'All Prices' },
                    { value: 'low', label: 'Under NPR 500' },
                    { value: 'mid', label: 'NPR 500 - 2000' },
                    { value: 'high', label: 'Above NPR 2000' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setPriceSort(opt.value); setPriceDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition ${priceSort === opt.value ? 'text-orange-500 font-medium bg-orange-50/50' : 'text-gray-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rating Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setRatingDropdownOpen(!ratingDropdownOpen); setCatDropdownOpen(false); setPriceDropdownOpen(false); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                  ratingSort ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Rating
                <ChevronDown size={15} className={`transition-transform ${ratingDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {ratingDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {[
                    { value: '', label: 'All Ratings' },
                    { value: '4', label: '4 Stars & above' },
                    { value: '3', label: '3 Stars & above' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setRatingSort(opt.value); setRatingDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition ${ratingSort === opt.value ? 'text-orange-500 font-medium bg-orange-50/50' : 'text-gray-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========= Service Count ========= */}
      <section className="px-6 pt-6 pb-2">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500 text-sm">
            Showing <span className="font-bold text-gray-900">{totalCount} Services</span>
            {catFilter && categories.find(c => c.id === catFilter) && (
              <span> in <span className="font-semibold text-orange-500">{categories.find(c => c.id === catFilter)?.name}</span></span>
            )}
          </p>
        </div>
      </section>

      {/* ========= Service Grid ========= */}
      <section className="py-6 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20">
              <Layers size={56} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">No services found</p>
              <p className="text-gray-400 text-sm mt-1">
                {catFilter
                  ? 'No services available in this category yet. Try a different category.'
                  : 'Try a different search or category'}
              </p>
              {catFilter && (
                <button
                  onClick={() => handleCategoryChange('')}
                  className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm"
                >
                  Clear category filter
                </button>
              )}
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
                      <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                        {svc.category?.name}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-orange-500 transition-colors">
                        {svc.name}
                      </h3>
                      <p className="text-orange-500 text-xs font-medium mt-0.5">
                        by Kaam Chha
                      </p>
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                        {svc.description || 'No description available'}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock size={14} />
                          <span>{svc.duration} min</span>
                        </div>
                        <p className="text-orange-500 font-bold text-lg">
                          NPR {Number(svc.price).toLocaleString()}
                        </p>
                      </div>

                      {/* Rating (static for now) */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={13} className="text-gray-200 fill-gray-200" />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">No reviews</span>
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

      {/* Close dropdowns on click outside */}
      {(catDropdownOpen || priceDropdownOpen || ratingDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setCatDropdownOpen(false); setPriceDropdownOpen(false); setRatingDropdownOpen(false); }}
        />
      )}
    </div>
  );
};

export default Services;
