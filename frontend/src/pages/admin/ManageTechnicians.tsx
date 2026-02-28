import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Users,
  UserCog,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  listTechnicians,
  getTechnicianStats,
  updateUser,
  type TechnicianUser,
  type TechnicianStats,
  type Pagination,
} from '../../services/admin.service';
import { DashboardStatsSkeleton, UserTableSkeleton } from '../../components/common/Skeleton';

const kycBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const ManageTechnicians: React.FC = () => {
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (kycFilter) params.kycStatus = kycFilter;
      if (activeFilter) params.isActive = activeFilter;
      const [techRes, statsRes] = await Promise.all([
        listTechnicians(params),
        getTechnicianStats(),
      ]);
      if (techRes.success) {
        setTechnicians(techRes.data);
        setPagination(techRes.pagination);
      }
      if (statsRes.success) {
        if (statsRes.data) setStats(statsRes.data);
      }
    } catch {
      toast.error('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, [page, search, kycFilter, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, kycFilter, activeFilter]);

  const handleToggleActive = async (tech: TechnicianUser) => {
    setTogglingId(tech.id);
    try {
      const res = await updateUser(tech.id, { isActive: !tech.isActive });
      if (res.success) {
        toast.success(`Technician ${tech.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchData();
      }
    } catch {
      toast.error('Failed to update technician status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Technicians</h1>
        <p className="text-gray-500 mt-1">View and manage all registered technicians</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.totalTechnicians, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active', value: stats.activeTechnicians, color: 'text-green-600 bg-green-50' },
            { label: 'Inactive', value: stats.inactiveTechnicians, color: 'text-gray-600 bg-gray-100' },
            { label: 'KYC Pending', value: stats.pendingKYC, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'KYC Approved', value: stats.approvedKYC, color: 'text-green-600 bg-green-50' },
            { label: 'KYC Rejected', value: stats.rejectedKYC, color: 'text-red-600 bg-red-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
            </div>
          ))}
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
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All KYC Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <UserTableSkeleton rows={6} />
      ) : technicians.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No technicians found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Technician</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {technicians.map((tech) => (
                    <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {tech.profile?.avatar ? (
                            <img
                              src={tech.profile.avatar}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                              {(tech.profile?.name || tech.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {tech.profile?.name || 'No name'}
                            </p>
                            <p className="text-xs text-gray-400">{tech.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {tech.kyc ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              kycBadge[tech.kyc.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tech.kyc.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not submitted</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{tech._count?.technicianOrders ?? 0}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{tech._count?.createdServices ?? 0}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            tech.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tech.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(tech.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(tech)}
                          disabled={togglingId === tech.id}
                          className={`flex items-center gap-1 text-sm font-medium ${
                            tech.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          } disabled:opacity-50`}
                          title={tech.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {togglingId === tech.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : tech.isActive ? (
                            <ToggleRight size={20} />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                          {tech.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={!pagination.hasNext}
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
    </div>
  );
};

export default ManageTechnicians;
