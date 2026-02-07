import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  ArrowLeft,
  Loader2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle,
  Home,
  Calendar,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import LoginPromptModal from '../../components/common/LoginPromptModal';
import { useAuth } from '../../hooks/useAuth';
import { getServiceById, type ServiceItem } from '../../services/service.service';

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleBookService = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    // TODO: proceed with actual booking flow
  };

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

  // Build image array (use service image, repeated for gallery effect since we have 1 image)
  const images = service.image ? [service.image, service.image, service.image] : [];

  const staticInclusions = [
    'Tap leak and diagnosis repair',
    'Water and seal replacement',
    'Water flow optimization',
    'Leak testing and verification',
    'Basic clean up after service',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
            <Link to="/" className="hover:text-orange-500 transition">
              <Home size={15} />
            </Link>
            <span>/</span>
            <Link to="/services" className="hover:text-orange-500 transition">Services</Link>
            <span>/</span>
            <Link
              to={`/services?category=${service.categoryId}`}
              className="hover:text-orange-500 transition"
            >
              {service.category?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{service.name}</span>
          </nav>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{service.name}</h1>
          <p className="text-sm text-gray-500 mb-6">
            by <span className="text-orange-500 font-medium">Kaam Chha</span>
          </p>

          {/* Main content: Image + Booking sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left: Image Gallery + Details */}
            <div className="flex-1 space-y-8">

              {/* Main Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="relative h-72 md:h-96 bg-gray-100">
                  {images.length > 0 ? (
                    <img
                      src={images[currentImage]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Layers size={64} className="text-gray-300" />
                    </div>
                  )}
                  {/* Category badge */}
                  <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow">
                    {service.category?.name}
                  </span>

                  {/* Image nav arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                      >
                        <ChevronLeft size={18} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                      >
                        <ChevronRight size={18} className="text-gray-700" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-3 p-4">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
                          currentImage === i ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Description */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Service Description</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {service.description || 'Professional service provided by verified technicians. Our certified professionals diagnose and fix common problems quickly and efficiently.'}
                </p>

                {/* What's Included */}
                <div className="mb-2">
                  <h3 className="flex items-center gap-2 text-orange-500 font-semibold text-sm mb-3">
                    <CheckCircle size={16} />
                    What's Included
                  </h3>
                  <ul className="space-y-2">
                    {staticInclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-orange-600 font-bold text-base">
                    From NPR {Number(service.price).toLocaleString()}
                  </p>
                  <p className="text-orange-500/70 text-sm mt-1">
                    Fair price range: NPR {Number(service.price).toLocaleString()} - {(Number(service.price) * 1.8).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Reviews (static for now) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Customer Reviews</h2>

                {/* Empty state */}
                <div className="text-center py-8 text-gray-400">
                  <Star size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-medium">No reviews yet</p>
                  <p className="text-xs mt-1">Be the first to review this service</p>
                </div>
              </div>
            </div>

            {/* Right: Booking Card (sticky) */}
            <div className="lg:w-[340px] flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Book a Service</h3>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-gray-600 text-sm font-medium">Price</span>
                    <span className="text-xl font-bold text-gray-900">
                      {Number(service.price).toLocaleString()}
                    </span>
                  </div>

                  {/* Select Location */}
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Select Location</p>
                    <p className="text-xs text-gray-400 mb-2">Enter your location where we should provide the service</p>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your location/address"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-10"
                      />
                      <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" />
                    </div>
                  </div>

                  {/* Select Date */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Select Date</p>
                        <p className="text-xs text-gray-400">Choose your preferred date</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={13} />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {/* Date selector row */}
                    <div className="flex gap-1.5">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = date.getDate();
                        return (
                          <button
                            key={i}
                            className={`flex-1 flex flex-col items-center py-2 rounded-lg border text-xs transition ${
                              i === 0
                                ? 'border-orange-400 bg-orange-50 text-orange-600 font-semibold'
                                : 'border-gray-200 text-gray-500 hover:border-orange-300'
                            }`}
                          >
                            <span className="text-[10px]">{dayName}</span>
                            <span className="font-bold text-sm">{dayNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Time */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Select Time</p>
                    <p className="text-xs text-gray-400 mb-2">Choose your preferred time</p>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="8:00 AM - 10:00 AM"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-10"
                        readOnly
                      />
                      <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400" />
                    </div>
                  </div>

                  {/* Book Service Button */}
                  <button
                    onClick={handleBookService}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm shadow-orange-500/20 hover:shadow-md"
                  >
                    Book Service
                  </button>
                </div>

                {/* Service Info */}
                <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Clock size={16} className="text-orange-400" />
                    <span>Duration: <strong className="text-gray-700">{service.duration} min</strong></span>
                  </div>
                  {service.serviceRadius && (
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-3">
                      <MapPin size={16} className="text-orange-400" />
                      <span>Service Radius: <strong className="text-gray-700">{service.serviceRadius} km</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default ServiceDetails;

