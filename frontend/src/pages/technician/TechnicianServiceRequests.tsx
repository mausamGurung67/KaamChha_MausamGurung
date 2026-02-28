import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  MapPin,
  Tag,
  DollarSign,
  User,
  Search,
  CheckCircle,
} from 'lucide-react';
import {
  listServiceRequests,
  assignTechnician,
  updateServiceRequestStatus,
  type ServiceRequestItem,
  type ServiceRequestStatus,
} from '../../services/serviceRequest.service';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { ServiceRequestListSkeleton } from '../../components/common/Skeleton';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const TechnicianServiceRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | ''>('');
  const [tab, setTab] = useState<'open' | 'my'>('open');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();

      if (tab === 'open') {
        params.status = 'OPEN';
      } else {
        params.assignedTechnicianId = user?.id;
        if (statusFilter) params.status = statusFilter;
      }

      const res = await listServiceRequests(params);
      if (res.success) {
        setRequests(res.data.serviceRequests);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [page, search, tab, statusFilter, user?.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, statusFilter]);

  const handleAccept = async (id: string) => {
    try {
      await assignTechnician(id);
      toast.success('You have accepted the service request!');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateServiceRequestStatus(id, 'COMPLETED');
      toast.success('Marked as completed');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Service Requests</h1>
        <p className="text-gray-500 mt-1">Browse and accept requests posted by customers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('open')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'open'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Open Requests
        </button>
        <button
          onClick={() => setTab('my')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'my'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          My Accepted
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, category, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
          />
        </div>
        {tab === 'my' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ServiceRequestStatus | '')}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <ServiceRequestListSkeleton count={4} />
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {tab === 'open' ? 'No open requests right now' : 'No accepted requests yet'}
          </h3>
          <p className="text-gray-500 mt-1">
            {tab === 'open'
              ? 'Check back later for new customer requests.'
              : 'Accept open requests to see them here.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{total} request{total !== 1 ? 's' : ''} found</p>
          <div className="grid gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Customer Posted
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 truncate">{req.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[req.status]
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{req.description}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-orange-500" />
                        Requested by: {req.customer?.profile?.name || req.customer?.email || 'Customer'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Tag size={14} />
                        {req.category}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {req.location}
                      </span>
                      {req.budget && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={14} />
                          Budget: NPR {parseFloat(req.budget).toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'OPEN' && (
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition shadow-md"
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>
                    )}
                    {req.status === 'ASSIGNED' &&
                      req.assignedTechnicianId === user?.id && (
                        <button
                          onClick={() => handleComplete(req.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition shadow-md"
                        >
                          <CheckCircle size={16} />
                          Mark Complete
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TechnicianServiceRequests;
