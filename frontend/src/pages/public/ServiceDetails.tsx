import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  ArrowLeft,
  Loader2,
  Layers,
  User,
  Calendar,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { getServiceById, type ServiceItem } from '../../services/service.service';

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchService = async () => {
      try {
        const res = await getServiceById(id);
        if (res.success) setService(res.data.service);
        else setError('Service not found');
      } catch {
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Layers size={56} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium text-lg">{error || 'Service not found'}</p>
          <Link
            to="/services"
            className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1"
          >
            <ArrowLeft size={16} /> Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back link */}
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-gray-500 hover:text-orange-500 text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Services
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Image */}
            <div className="relative h-64 md:h-80 bg-gray-100">
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Layers size={64} className="text-gray-300" />
                </div>
              )}
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-sm font-medium text-gray-700 px-4 py-1.5 rounded-full shadow-sm">
                {service.category?.name}
              </span>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{service.name}</h1>
                  <p className="text-gray-500 mt-3 leading-relaxed">
                    {service.description || 'No description available.'}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-orange-50 rounded-xl px-6 py-4 text-center md:min-w-[160px]">
                  <p className="text-sm text-orange-600 font-medium">Starting at</p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">
                    Rs. {Number(service.price).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Clock size={22} className="mx-auto text-orange-400 mb-1" />
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{service.duration} min</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Layers size={22} className="mx-auto text-orange-400 mb-1" />
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{service.category?.name}</p>
                </div>
                {service.serviceRadius && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <MapPin size={22} className="mx-auto text-orange-400 mb-1" />
                    <p className="text-xs text-gray-400">Radius</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {service.serviceRadius} km
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Calendar size={22} className="mx-auto text-orange-400 mb-1" />
                  <p className="text-xs text-gray-400">Listed</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {new Date(service.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Creator */}
              <div className="mt-8 flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                {service.creator?.profile?.avatar ? (
                  <img
                    src={service.creator.profile.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User size={18} className="text-orange-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {service.creator?.profile?.name || 'Service Provider'}
                  </p>
                  <p className="text-xs text-gray-400">Service listed by</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-sm shadow-orange-500/20 hover:shadow-md">
                  Book This Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
