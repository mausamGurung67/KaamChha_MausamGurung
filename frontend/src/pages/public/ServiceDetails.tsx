import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Home,
  Calendar,
  MapPin,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import LoginPromptModal from '../../components/common/LoginPromptModal';
import MapPicker, { type LatLng } from '../../components/common/MapPicker';
import { useAuth } from '../../hooks/useAuth';
import { getServiceById, type ServiceItem } from '../../services/service.service';
import { createBooking } from '../../services/booking.service';
import { ServiceDetailSkeleton } from '../../components/common/Skeleton';
import ReviewList from '../../components/review/ReviewList';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // ── Booking form state ──
  const [selectedPosition, setSelectedPosition] = useState<LatLng | null>(null);
  const [serviceAddress, setServiceAddress] = useState('');
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [showMap, setShowMap] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Time slots
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM',
  ];

  const handleLocationSelect = (latlng: LatLng, address: string) => {
    setSelectedPosition(latlng);
    setServiceAddress(address);
  };

  const handleBookService = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!serviceAddress.trim()) {
      setBookingError('Please select a location or enter an address');
      toast.error('Please select a location or enter an address');
      return;
    }
    if (!selectedTime) {
      setBookingError('Please select a time slot');
      toast.error('Please select a time slot');
      return;
    }
    if (!service || !id) return;

    setBookingError('');
    setBooking(true);
    try {
      // Build scheduledAt from selected date + time
      const [time, meridiem] = selectedTime.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(h, m, 0, 0);

      await createBooking({
        serviceId: id,
        scheduledAt: scheduledDate.toISOString(),
        serviceLatitude: selectedPosition?.lat || 27.7172,
        serviceLongitude: selectedPosition?.lng || 85.3240,
        serviceAddress: serviceAddress.trim(),
      });

      toast.success('Booking created successfully!');
      navigate('/my-bookings', { state: { bookingSuccess: true } });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create booking. Please try again.';
      setBookingError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBooking(false);
    }
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
        <ServiceDetailSkeleton />
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

  // Build image array from service.images (multi-image) or fall back to single image
  const images = (service.images && service.images.length > 0)
    ? service.images
    : service.image
    ? [service.image]
    : [];

  const inclusions = (service.inclusions && service.inclusions.length > 0)
    ? service.inclusions
    : [
        'Professional service by verified technicians',
        'Quality materials and tools',
        'Post-service cleanup',
        'Service warranty included',
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
                    {inclusions.map((item, i) => (
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

              {/* Customer Reviews */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Customer Reviews</h2>
                <ReviewList serviceId={service.id} initialLimit={5} />
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
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Select Location</p>
                        <p className="text-xs text-gray-400">Click on map or search for your address</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 transition"
                      >
                        <MapPin size={13} />
                        {showMap ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>

                    {showMap && (
                      <div className="mt-2">
                        <MapPicker
                          position={selectedPosition}
                          onLocationSelect={handleLocationSelect}
                          height="220px"
                        />
                      </div>
                    )}

                    {!showMap && (
                      <div className="relative mt-2">
                        <input
                          type="text"
                          value={serviceAddress}
                          onChange={(e) => setServiceAddress(e.target.value)}
                          placeholder="Enter your location/address"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-10"
                        />
                        <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" />
                      </div>
                    )}

                    {selectedPosition && (
                      <p className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle size={11} />
                        Location selected
                      </p>
                    )}
                  </div>

                  {/* Select Date */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Select Date</p>
                        <p className="text-xs text-gray-400">Choose your preferred date</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker()}
                        className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium transition cursor-pointer"
                      >
                        <Calendar size={13} />
                        <span>{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </button>
                      {/* Hidden native date picker */}
                      <input
                        ref={dateInputRef}
                        type="date"
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const picked = new Date(e.target.value + 'T00:00:00');
                            setSelectedDate(picked);
                            // Check if picked date is within the 7-day quick row
                            const idx = next7Days.findIndex(
                              (d) => d.toDateString() === picked.toDateString()
                            );
                            setSelectedDateIdx(idx >= 0 ? idx : -1);
                          }
                        }}
                      />
                    </div>
                    {/* Date selector row */}
                    <div className="flex gap-1.5">
                      {next7Days.map((date, i) => {
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = date.getDate();
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedDateIdx(i);
                              setSelectedDate(date);
                            }}
                            className={`flex-1 flex flex-col items-center py-2 rounded-lg border text-xs transition ${
                              selectedDateIdx === i
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
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Select Time</p>
                        <p className="text-xs text-gray-400">Choose your preferred time</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => timeInputRef.current?.showPicker()}
                        className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium transition cursor-pointer"
                        title="Pick custom time"
                      >
                        <Clock size={13} />
                        <span>{selectedTime || 'Custom'}</span>
                      </button>
                      {/* Hidden native time picker */}
                      <input
                        ref={timeInputRef}
                        type="time"
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        value={
                          selectedTime
                            ? (() => {
                                // Convert "02:00 PM" → "14:00" for native input
                                const [time, meridiem] = selectedTime.split(' ');
                                let [h, m] = time.split(':').map(Number);
                                if (meridiem === 'PM' && h !== 12) h += 12;
                                if (meridiem === 'AM' && h === 12) h = 0;
                                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                              })()
                            : ''
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            const [h, m] = e.target.value.split(':').map(Number);
                            const meridiem = h >= 12 ? 'PM' : 'AM';
                            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const formatted = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;
                            setSelectedTime(formatted);
                          }
                        }}
                      />
                    </div>
                    {/* Time slot grid */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 rounded-lg border text-xs transition ${
                            selectedTime === slot
                              ? 'border-orange-400 bg-orange-50 text-orange-600 font-semibold'
                              : 'border-gray-200 text-gray-500 hover:border-orange-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Book Service Button */}
                  {bookingError && (
                    <p className="text-xs text-red-500 mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {bookingError}
                    </p>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleBookService}
                    disabled={booking}
                    isLoading={booking}
                    className="rounded-xl py-3.5"
                  >
                    Book Service
                  </Button>
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

