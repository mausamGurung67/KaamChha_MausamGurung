import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowRight, Star, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Facebook, Twitter } from 'lucide-react';

// Image imports
import logoImg from '../../assets/images/logo.png';
import illushome from '../../assets/images/illushome.png';
import heroBg from '../../assets/images/hero11.png';
import hw1 from '../../assets/images/hw1.png';
import hw2 from '../../assets/images/hw2.png';
import hw3 from '../../assets/images/hw3.png';
import hw5 from '../../assets/images/hw5.png';
import hw6 from '../../assets/images/hw6.png';
import footerLogo from '../../assets/images/footerillus.png';

const Home: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const services = [
    { name: 'Plumbing', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400' },
    { name: 'Electrical', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Cleaning', image: 'https://images.unsplash.com/photo-1581578731117-104f2a41272c?auto=format&fit=crop&q=80&w=400' },
    { name: 'Painting', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
  ];

  const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'Garden'];

  const testimonials = [
    {
      quote: "Michael is very skilled and highly professional. Understood the assignment, followed instructions, and was also able to be flexible and creative. Would definitely hire him again!",
      name: "Mausam Gurung",
      date: "Jan 14, 2025",
      rating: 5
    },
    {
      quote: "Michael is very skilled and highly professional. Understood the assignment, followed instructions, and was also able to be flexible and creative. Would definitely hire him again!",
      name: "Mausam Gurung",
      date: "Jan 14, 2025",
      rating: 5
    },
    {
      quote: "Michael is very skilled and highly professional. Understood the assignment, followed instructions, and was also able to be flexible and creative. Would definitely hire him again!",
      name: "Mausam Gurung",
      date: "Jan 14, 2025",
      rating: 5
    }
  ];

  const faqs = [
    { question: "Which cities/areas are currently covered?", answer: "We currently operate in major cities across Nepal including Kathmandu, Pokhara, Biratnagar, Itahari, and more. We're expanding rapidly to cover more areas." },
    { question: "Are technicians verified and background checked?", answer: "Yes, all our technicians undergo thorough background verification, skill assessment, and identity verification before joining our platform." },
    { question: "What if no technicians accept my request?", answer: "If no technician accepts within a reasonable time, we'll notify you and help you reschedule or find alternative solutions." },
    { question: "Do I need to pay extra apart from the listed price?", answer: "The listed price includes service charges. Additional costs may apply only for materials or parts needed, which will be communicated upfront." },
    { question: "What if I'm not satisfied with the service?", answer: "We have a satisfaction guarantee. If you're not happy with the service, contact our support team and we'll make it right." }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">

      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50 py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
          {/* Left: Logo + Become Technician */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex-shrink-0">
              <img src={logoImg} alt="Kaam Chha Logo" className="h-12 w-auto" />
            </Link>
            <Link 
              to="/auth/register-technician" 
              className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg"
            >
              Become Technician
            </Link>
          </div>

          {/* Center: Nav Links */}
          <div className="hidden md:flex items-center space-x-10 text-sm font-medium">
            <Link to="/" className="text-orange-500 hover:text-orange-600 transition font-semibold">Home</Link>
            <Link to="/services" className="text-gray-700 hover:text-orange-500 transition">Services</Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-orange-500 transition">How It Works</Link>
            <Link to="/about" className="text-gray-700 hover:text-orange-500 transition">About Us</Link>
          </div>

          {/* Right: Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/auth/login" className="text-gray-700 hover:text-orange-500 text-sm font-medium transition">
              Sign In
            </Link>
            <Link 
              to="/auth/register" 
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-6 py-2.5 rounded-full font-medium transition shadow-md shadow-orange-500/30 hover:shadow-lg"
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-7">
            <h1 className="text-5xl md:text-6xl lg:text-6xl font-bold leading-tight text-gray-900">
              Get Anything Done With<br />
              <span className="text-gray-900">Trusted Helpers</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-lg leading-relaxed">
              Connect with verified, skilled technicians for all your home service needs.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                to="/services" 
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold transition shadow-lg shadow-orange-500/30 hover:shadow-xl"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link 
                to="/services" 
                className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500 px-8 py-4 rounded-full font-semibold transition hover:shadow-md"
              >
                Find Service <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src={illushome} 
              alt="Worker Illustration" 
              className="w-full max-w-md lg:max-w-lg object-contain drop-shadow-2xl" 
            />
          </div>
        </div>
      </section>

      {/* ================= HERO BANNER WITH IMAGE ================= */}
      <section className="relative w-full px-6 pb-6">
        <div className="relative h-[450px] md:h-[500px] overflow-hidden rounded-3xl mx-auto max-w-[1400px]">
          <img 
            src={heroBg} 
            alt="Construction Worker" 
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              {/* Left Text */}
              <div className="text-white max-w-xl">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
                  Empowering Local Skills,<br />
                  Serving Local Needs
                </h2>
                <p className="text-white/90 text-base leading-relaxed">
                  Book trusted local workers, get quality service, and support community employment all in one place.
                </p>
              </div>

              {/* Right: Category Pills */}
              <div className="flex flex-wrap gap-3 max-w-sm">
                {categories.map((cat) => (
                  <span 
                    key={cat} 
                    className="px-5 py-2.5 bg-white/25 backdrop-blur-md border border-white/40 rounded-full text-white text-sm font-medium cursor-pointer hover:bg-white/35 transition shadow-lg"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= POPULAR SERVICES ================= */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gray-400 text-sm tracking-widest mb-3 uppercase font-medium">——— Our Services ———</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Explore Our <span className="text-orange-500 border-b-4 border-orange-300 pb-1">Popular Services</span>
            </h2>
          </div>

          {/* Services Carousel */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
              {services.map((service, index) => (
                <div 
                  key={index} 
                  className="group relative overflow-hidden rounded-3xl cursor-pointer h-72 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <img 
                    src={service.image}
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <h3 className="text-white text-xl font-bold">{service.name}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Navigation */}
            <div className="flex justify-center items-center gap-5 mt-10">
              <button 
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                className="p-3 rounded-full border-2 border-gray-300 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2.5">
                {[0, 1, 2, 3].map((dot) => (
                  <span 
                    key={dot} 
                    className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === dot ? 'bg-orange-500 w-8' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <button 
                onClick={() => setCurrentSlide(Math.min(3, currentSlide + 1))}
                className="p-3 rounded-full border-2 border-gray-300 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link 
              to="/services" 
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-semibold transition shadow-lg shadow-orange-500/30 hover:shadow-xl text-base"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-32">
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-5">
                  How Does<br />
                  <span className="text-orange-500">Kaam Chha</span><br />
                  Work?
                </h2>
                <p className="text-gray-600 text-base leading-relaxed mb-8">
                  Discover how Kaam Chha connects you to trusted home services. Whether you need expert help or want to offer your skills.
                </p>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                  <Link 
                    to="/services" 
                    className="text-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                  >
                    I need help
                  </Link>
                  <Link 
                    to="/auth/register-technician" 
                    className="text-center bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                  >
                    I want to work
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Steps */}
            <div className="lg:col-span-9 space-y-20">
              
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2">
                  <img src={hw1} alt="Choose Service" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                  <span className="inline-block text-orange-500 font-bold text-lg bg-orange-50 px-4 py-1.5 rounded-full">01</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    Choose your <span className="text-orange-500">Service</span>
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Pick service you need from wide range of trusted categories like Plumbing, Electrical, Cleaning, and more.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="md:w-1/2 flex justify-end">
                  <img src={hw2} alt="Tell Us Need" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4 md:text-right">
                  <span className="inline-block text-orange-500 font-bold text-lg bg-orange-50 px-4 py-1.5 rounded-full">02</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    Tell us your <span className="text-orange-500">Need</span>
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Select your preferred date and time, and confirm your location. This helps us match you with the right technician who's skilled for your specific need.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2">
                  <img src={hw3} alt="Get Matched" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                  <span className="inline-block text-orange-500 font-bold text-lg bg-orange-50 px-4 py-1.5 rounded-full">03</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    Get matched <span className="text-orange-500">Instantly</span>
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Once you submit your request, Kaam Chha instantly connects you with nearby verified technicians. You'll see their ratings, experience, and availability – giving you full control to accept the one that fits best.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="md:w-1/2 flex justify-end">
                  <img src={hw5} alt="Track and Chat" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4 md:text-right">
                  <span className="inline-block text-orange-500 font-bold text-lg bg-orange-50 px-4 py-1.5 rounded-full">04</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    Track & Chat <span className="text-orange-500">in real-time</span>
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    After booking, follow your technician's journey on the live map. Use the secure in-app chat or call feature to coordinate easily and stay updated on every step.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2">
                  <img src={hw6} alt="Pay Safely" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                  <span className="inline-block text-orange-500 font-bold text-lg bg-orange-50 px-4 py-1.5 rounded-full">05</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    Pay & Review <span className="text-orange-500">safely</span>
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Complete your payment seamlessly via eSewa, Khalti, IME Pay, Bank, or Cash on Delivery. Once the job is done, share your experience with a quick rating and review to help others choose better.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gray-400 text-sm tracking-widest mb-3 uppercase font-medium">——— Testimonials ———</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Clients Feedback About Their<br />
              <span className="text-orange-500 border-b-4 border-orange-300 pb-1">Experience</span> With Us
            </h2>
          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-md hover:shadow-2xl hover:border-orange-200 transition-all duration-300"
              >
                {/* Quote Icon */}
                <div className="text-orange-500 text-5xl font-serif mb-5">"</div>
                
                {/* Quote Text */}
                <p className="text-gray-700 text-base leading-relaxed mb-8">
                  "{item.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-500 font-bold text-base">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{item.name}</h4>
                      <p className="text-gray-500 text-sm">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gray-400 text-sm tracking-widest mb-3 uppercase font-medium">——— Questions ———</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Frequently Asked <span className="text-orange-500 border-b-4 border-orange-300 pb-1">Questions</span>
            </h2>
            <p className="text-gray-600 text-base mt-6 leading-relaxed">
              Here are some common questions you might have about Kaam Chha
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-left font-semibold text-gray-900 hover:bg-orange-50 transition"
                >
                  <span className="text-base pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="text-orange-500 flex-shrink-0" size={22} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={22} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-gray-600 text-base leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
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
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-5 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:bg-gray-750 transition"
                />
                <textarea 
                  placeholder="Your Queries" 
                  rows={5}
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-5 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:bg-gray-750 transition resize-none"
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

export default Home;
