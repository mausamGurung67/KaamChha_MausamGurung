import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Phone, Mail, MapPin, Facebook, Twitter, BarChart3, Smile, Monitor, Shield, Lock, Award } from 'lucide-react';
import Navbar from '../../components/common/Navbar';

// Image imports
import aboutHero from '../../assets/images/about-hero.png';
import aboutIllustration from '../../assets/images/about-illustration.png';
import aboutQuality from '../../assets/images/about-quality.png';
import footerLogo from '../../assets/images/footerillus.png';

const features = [
  {
    title: 'Customer Satisfaction',
    description: 'Quality workmanship, service guarantees, and responsive support.',
    icon: <BarChart3 size={22} />,
    side: 'left' as const,
  },
  {
    title: 'Easy & Fast Booking',
    description: 'Book home services in minutes through a simple and user-friendly platform.',
    icon: <Smile size={22} />,
    side: 'right' as const,
  },
  {
    title: 'Wide Range of Services',
    description: 'Plumbing, electrical, cleaning, repairs, maintenance, everything in one place.',
    icon: <Monitor size={22} />,
    side: 'left' as const,
  },
  {
    title: 'Transparent Pricing',
    description: 'Clear pricing with no hidden charges—know what you pay before the job starts.',
    icon: <Shield size={22} />,
    side: 'right' as const,
  },
  {
    title: 'Reliable & Secure',
    description: 'Professionals arrive on time and complete work efficiently.',
    icon: <Lock size={22} />,
    side: 'left' as const,
  },
  {
    title: 'Verified Professionals',
    description: 'Skilled, background-checked technicians you can trust in your home.',
    icon: <Award size={22} />,
    side: 'right' as const,
  },
];

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="pt-28 pb-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
            <div className="lg:w-1/2">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-tight text-gray-900">
                Our Story, Vision<br />and Values
              </h1>
            </div>
            <div className="lg:w-1/2 lg:pt-3 mt-6">
              <p className="text-gray-500 text-base leading-relaxed">
                Learn about our commitment to excellence, innovation and principles that
                guide our work everyday.
              </p>
            </div>
          </div>
          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden">
            <img
              src={aboutHero}
              alt="Our team of skilled technicians"
              className="w-full h-[340px] md:h-[420px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* ================= ABOUT / MISSION SECTION ================= */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-14 flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Text */}
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Real Solutions for<br />Everyday Home Needs
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Founded in 2025, Kaam Chha is a modern home service platform
                created to make finding trusted household professionals simple, fast,
                and reliable. We connect homeowners with skilled technicians for
                services such as plumbing, electrical work, cleaning, repairs, and
                more—right when they need it.
              </p>
              <p className="text-gray-600 text-base leading-relaxed">
                At Kaam Chha, our mission is to remove the hassle from home
                maintenance by delivering quality service through verified
                professionals, transparent pricing, and easy booking. By combining
                technology with skilled manpower, we ensure every job is done
                efficiently, safely, and with complete peace of mind.
              </p>
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-full font-semibold transition shadow-lg shadow-orange-500/30 hover:shadow-xl text-sm"
              >
                Join Now <ArrowUpRight size={16} />
              </Link>
            </div>

            {/* Right: Illustration */}
            <div className="lg:w-1/2 flex justify-center">
              <img
                src={aboutIllustration}
                alt="Home service illustration"
                className="w-full max-w-md object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-gray-500 text-base leading-relaxed max-w-2xl mx-auto">
              Delivering reliable, fast, and professional home services through skilled
              experts and smart technology—so your home problems get solved without stress.
            </p>
          </div>

          {/* Features Hub Layout */}
          <div className="relative">
            {/* Center Icon - visible on md+ */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                </svg>
              </div>
            </div>

            {/* Vertical line through center - visible on md+ */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray-200" />

            {/* Feature rows */}
            <div className="space-y-8 md:space-y-0">
              {[0, 1, 2].map((rowIndex) => {
                const leftFeature = features[rowIndex * 2];
                const rightFeature = features[rowIndex * 2 + 1];

                return (
                  <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative md:py-8">
                    {/* Horizontal connector lines - visible on md+ */}
                    <div className="hidden md:block absolute top-1/2 left-[calc(50%-80px)] w-16 h-px bg-gray-200" />
                    <div className="hidden md:block absolute top-1/2 right-[calc(50%-80px)] w-16 h-px bg-gray-200" />

                    {/* Left Feature */}
                    <div className="flex items-center gap-5 md:flex-row-reverse md:text-right">
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
                          <h3 className="font-bold text-gray-900 text-base mb-2">{leftFeature.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed">{leftFeature.description}</p>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                        {leftFeature.icon}
                      </div>
                    </div>

                    {/* Right Feature */}
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                        {rightFeature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
                          <h3 className="font-bold text-gray-900 text-base mb-2">{rightFeature.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed">{rightFeature.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= QUALITY HOME SERVICES CTA ================= */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
            {/* Left: Image */}
            <div className="lg:w-1/2">
              <img
                src={aboutQuality}
                alt="Quality home services"
                className="w-full h-full min-h-[320px] object-cover"
              />
            </div>

            {/* Right: Content */}
            <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-5">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Quality Home Services<br />You Can Trust
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Our mission is to take the stress out of home maintenance
                by delivering reliable, affordable, and professional services—
                right to your doorstep.
              </p>
              <div>
                <p className="text-gray-900 font-semibold text-base mb-2">
                  Looking for trusted experts for your home needs?
                </p>
                <p className="text-gray-600 text-base leading-relaxed">
                  From quick fixes to regular maintenance, Kaam Chha is
                  helping families keep their homes running smoothly. Book
                  your service today.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-full font-semibold transition shadow-lg shadow-orange-500/30 hover:shadow-xl text-sm"
                >
                  Join now <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-white pt-20 pb-10 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
            {/* Left: Contact Form */}
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                Couldn't find what you're<br />looking for?
              </h3>
              <p className="text-gray-400 text-base mb-8">Send us your queries</p>
              <form className="space-y-5 max-w-md">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-5 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                />
                <textarea
                  placeholder="Your Queries"
                  rows={5}
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-5 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition resize-none"
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                >
                  Send Query
                </button>
              </form>
            </div>

            {/* Right: Location & Contact */}
            <div className="lg:text-right">
              <div className="mb-10">
                <h4 className="text-orange-500 font-bold text-lg mb-5 tracking-wide">SUNSARI</h4>
                <p className="text-gray-300 text-base font-semibold mb-3">Kaam Chha</p>
                <p className="text-gray-400 text-base flex items-center lg:justify-end gap-3 mt-3">
                  <MapPin size={18} className="flex-shrink-0" />
                  Itahari-13, Sunsari, Nepal
                </p>
                <p className="text-gray-400 text-base flex items-center lg:justify-end gap-3 mt-3">
                  <Phone size={18} className="flex-shrink-0" />
                  +977 9802990003
                </p>
                <p className="text-gray-400 text-base flex items-center lg:justify-end gap-3 mt-3">
                  <Mail size={18} className="flex-shrink-0" />
                  info.kaamchha@gmail.com
                </p>
              </div>
              <div>
                <h4 className="text-orange-500 font-bold text-lg mb-5 tracking-wide">SOCIALS</h4>
                <div className="flex lg:justify-end gap-4">
                  <a href="#" className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-all hover:scale-110 shadow-lg">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-all hover:scale-110 shadow-lg">
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Large Watermark Text */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
            <h2 className="text-[140px] md:text-[200px] font-bold text-gray-800/20 whitespace-nowrap tracking-wider">
              KAAM CHHA
            </h2>
          </div>

          {/* Footer Logo */}
          <div className="relative z-10 flex justify-center mb-10">
            <img src={footerLogo} alt="Footer Illustration" className="h-24 object-contain opacity-40" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
