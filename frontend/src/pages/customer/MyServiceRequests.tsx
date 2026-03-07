import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Tag,
  DollarSign,
  User,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Pagination from '../../components/common/Pagination';
import { ServiceRequestListSkeleton } from '../../components/common/Skeleton';
import {
  getMyServiceRequests,
  deleteServiceRequest,
  updateServiceRequestStatus,
  type ServiceRequestItem,
} from '../../services/serviceRequest.service';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const MyServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyServiceRequests();
      if (res.success) {
        setRequests(res.data.serviceRequests);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await updateServiceRequestStatus(id, 'CANCELLED');
      toast.success('Request cancelled');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      await deleteServiceRequest(id);
      toast.success('Request deleted');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginatedRequests = requests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Service Requests</h1>
              <p className="text-gray-500 mt-1">Track your posted service requests</p>
            </div>
            <button
              onClick={() => navigate('/post-service-request')}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-md"
            >
              + Post New Request
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <ServiceRequestListSkeleton count={3} />
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No service requests yet</h3>
              <p className="text-gray-500 mt-1">Post your first request and let technicians find you!</p>
              <button
                onClick={() => navigate('/post-service-request')}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition"
              >
                Post a Service Request
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {paginatedRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{req.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status]}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{req.description}</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
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
                            NPR {parseFloat(req.budget).toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {req.assignedTechnician && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <User size={14} className="text-blue-500" />
                          <span className="text-blue-600 font-medium">
                            Assigned to: {req.assignedTechnician.profile?.name || req.assignedTechnician.email}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'OPEN' && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      )}
                      {(req.status === 'CANCELLED' || req.status === 'COMPLETED') && (
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && requests.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={requests.length}
              onPageChange={setPage}
              label="requests"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyServiceRequests;
