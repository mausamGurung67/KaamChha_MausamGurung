import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldX,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  listKYCs,
  verifyKYC,
  type KYCEntry,
} from '../../services/admin.service';

type KYCTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const VerifyKYC: React.FC = () => {
  const [kycs, setKycs] = useState<KYCEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<KYCTab>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedKYC, setSelectedKYC] = useState<KYCEntry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchKYCs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (activeTab !== 'ALL') params.status = activeTab;
      const res = await listKYCs(params);
      if (res.success) {
        setKycs(res.data.kycs);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load KYC submissions' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchKYCs();
  }, [fetchKYCs]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      const data: any = { status };
      if (status === 'REJECTED' && rejectionReason.trim()) {
        data.rejectionReason = rejectionReason.trim();
      }
      const res = await verifyKYC(id, data);
      if (res.success) {
        setFeedback({ type: 'success', message: `KYC ${status.toLowerCase()} successfully` });
        setSelectedKYC(null);
        setShowRejectForm(false);
        setRejectionReason('');
        fetchKYCs();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to verify KYC' });
    } finally {
      setActionLoading(false);
    }
  };

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const tabs: { value: KYCTab; label: string }[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ALL', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verify KYC</h1>
        <p className="text-gray-500 mt-1">Review and verify technician KYC submissions</p>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'error' && <AlertCircle size={16} />}
          {feedback.type === 'success' && <ShieldCheck size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : kycs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <ShieldCheck size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No KYC submissions found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'PENDING' ? 'No pending verifications' : `No ${activeTab.toLowerCase()} submissions`}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Technician</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kycs.map((kyc) => (
                    <tr key={kyc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {kyc.technician?.profile?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">{kyc.technician?.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{kyc.documentType.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400">{kyc.documentNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            statusBadge[kyc.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {kyc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(kyc.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            setSelectedKYC(kyc);
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing page {page} of {totalPages} ({total} total)
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

      {/* ── KYC Detail Modal ── */}
      {selectedKYC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">KYC Details</h2>
                <p className="text-sm text-gray-400">
                  {selectedKYC.technician?.profile?.name || 'N/A'} &mdash;{' '}
                  {selectedKYC.technician?.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedKYC(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Document Type</p>
                  <p className="font-medium text-gray-800 mt-1">{selectedKYC.documentType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Document Number</p>
                  <p className="font-medium text-gray-800 mt-1">{selectedKYC.documentNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      statusBadge[selectedKYC.status]
                    }`}
                  >
                    {selectedKYC.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Submitted</p>
                  <p className="font-medium text-gray-800 mt-1">
                    {new Date(selectedKYC.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedKYC.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-600 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selectedKYC.rejectionReason}</p>
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Front', url: selectedKYC.documentFront },
                    { label: 'Back', url: selectedKYC.documentBack },
                    { label: 'Selfie', url: selectedKYC.selfie },
                  ].map((doc) => (
                    <div key={doc.label} className="space-y-1">
                      <p className="text-xs text-gray-400">{doc.label}</p>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                      >
                        <img
                          src={doc.url}
                          alt={doc.label}
                          className="w-full h-36 object-cover bg-gray-100"
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reject reason input */}
              {showRejectForm && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this KYC is being rejected..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>

            {/* Footer actions (only for PENDING) */}
            {selectedKYC.status === 'PENDING' && (
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
                {!showRejectForm ? (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50"
                    >
                      <ShieldX size={16} /> Reject
                    </button>
                    <button
                      onClick={() => handleVerify(selectedKYC.id, 'APPROVED')}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      Approve
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVerify(selectedKYC.id, 'REJECTED')}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShieldX size={16} />
                      )}
                      Confirm Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyKYC;
