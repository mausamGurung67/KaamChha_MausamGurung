import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

// --- UPDATED IMAGE PATHS (Adjusted for src/pages/public/) ---
import logoImg from '../../assets/images/logo.png';
import illushome from '../../assets/images/illushome.png';
import heroBg from '../../assets/images/hero11.png';
import hw1 from '../../assets/images/hw1.png';
import hw2 from '../../assets/images/hw2.png';
import hw3 from '../../assets/images/hw3.png';
// using hw5 as step 4 based on previous context
import hw5 from '../../assets/images/hw5.png'; 
import hw6 from '../../assets/images/hw6.png';
import footerLogo from '../../assets/images/footerillus.png';

const Home: React.FC = () => {
  // State for FAQ Accordion (typed as number or null)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const services = [
    { name: 'Plumbing', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400' },
    { name: 'Electrical', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Cleaning', image: 'https://images.unsplash.com/photo-1581578731117-104f2a41272c?auto=format&fit=crop&q=80&w=400' },
    { name: 'Painting', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* ================= NAV BAR ================= */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer">
            <Link to="/">
              <img src={logoImg} alt="Kaam Chha Logo" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Links */}
          <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
            <Link to="/" className="text-orange-500 hover:text-orange-600 transition">Home</Link>
            <Link to="/services" className="hover:text-orange-500 transition">Services</Link>
            <Link to="/how-it-works" className="hover:text-orange-500 transition">How It Works</Link>
            <Link to="/about" className="hover:text-orange-500 transition">About Us</Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/auth/login" className="text-gray-600 hover:text-orange-500 font-medium">Sign In</Link>
            <Link to="/auth/register" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full font-medium transition shadow-lg shadow-orange-500/30">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION (Top White Part) ================= */}
      <section className="pt-32 pb-10 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Get Anything Done With <span className="text-orange-500">Trusted Helpers</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg">
            From quick repairs to big projects, we connect you with skilled locals who are ready to help. Safe, fast, and reliable.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition shadow-lg">
              Get Started
            </button>
            <button className="flex items-center gap-2 bg-white text-orange-500 border-2 border-orange-100 px-8 py-3 rounded-full font-semibold hover:bg-orange-50 transition">
              Find Services <ArrowRight size={18} />
            </button>
          </div>
        </div>
        
        {/* Illustration (Running Man) */}
        <div className="flex justify-center lg:justify-end">
          <img src={illushome} alt="Worker Illustration" className="w-full max-w-md object-contain animate-fade-in-up" />
        </div>
      </section>

      {/* ================= HERO IMAGE BANNER ================= */}
      <div className="relative w-full h-[500px] bg-gray-900">
        <img src={heroBg} alt="Construction Worker" className="w-full h-full object-cover opacity-60" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Empowering Local Skills,<br/>Serving Local Needs
          </h2>
          
          {/* Search Bar Overlay */}
          <div className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center w-full max-w-3xl">
             <div className="flex items-center px-4 py-3 w-full border-b md:border-b-0 md:border-r border-gray-200">
                <Search className="text-gray-400 mr-2" />
                <input type="text" placeholder="What service do you need?" className="w-full outline-none text-gray-700 placeholder-gray-400" />
             </div>
             <div className="flex items-center px-4 py-3 w-full md:w-2/3">
                <MapPin className="text-gray-400 mr-2" />
                <input type="text" placeholder="Kathmandu, Nepal" className="w-full outline-none text-gray-700 placeholder-gray-400" />
             </div>
             <button className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold transition">
               Search
             </button>
          </div>

          {/* Quick Categories Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['Plumbing', 'Electrical', 'Cleaning', 'Painting', 'Moving'].map((cat) => (
              <span key={cat} className="px-4 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-sm cursor-pointer hover:bg-white/30 transition">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= POPULAR SERVICES ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-orange-500 font-semibold uppercase tracking-wider mb-2">Our Services</h3>
          <h2 className="text-3xl font-bold text-gray-900">Explore Our <span className="text-orange-500 border-b-4 border-orange-200">Popular Services</span></h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer h-64">
                <div className="absolute inset-0 bg-gray-900 group-hover:bg-orange-900/80 transition duration-500 z-10 opacity-30 group-hover:opacity-70"></div>
                <img 
                  src={service.image}
                  alt={service.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                  <h3 className="text-white text-xl font-bold">{service.name}</h3>
                  <p className="text-orange-200 text-sm mt-1 opacity-0 group-hover:opacity-100 transition transform translate-y-4 group-hover:translate-y-0">View Specialists &rarr;</p>
                </div>
              </div>
            ))}
        </div>
        
        <div className="text-center mt-12">
            <button className="bg-orange-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-orange-600 transition shadow-lg">
                View All Services
            </button>
        </div>
      </section>

      {/* ================= HOW IT WORKS (ZIG ZAG) ================= */}
      <section className="py-20 bg-orange-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-left mb-16">
            <h2 className="text-4xl font-bold text-gray-900">How Does <br/><span className="text-orange-500">Kaam Chha</span> Work?</h2>
            <p className="text-gray-600 mt-4 max-w-md">Whether you need help or want to help, we make the process simple, safe, and secure.</p>
          </div>

          <div className="space-y-24">
            
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="md:w-1/2 flex justify-center">
                    <img src={hw1} alt="Choose Service" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-4">01</div>
                    <h3 className="text-2xl font-bold text-gray-800">Choose your Service</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Browse through our extensive list of categories. From plumbing to IT support, find exactly what you are looking for with just a few clicks.
                    </p>
                </div>
            </div>

            {/* Step 2 (Reverse Layout) */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                <div className="md:w-1/2 flex justify-center">
                    <img src={hw2} alt="Tell Us Need" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-4">02</div>
                    <h3 className="text-2xl font-bold text-gray-800">Tell us your Need</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Select your location and describe your problem. The more details you provide, the better we can match you with the perfect professional.
                    </p>
                </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="md:w-1/2 flex justify-center">
                    <img src={hw3} alt="Get Matched" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-4">03</div>
                    <h3 className="text-2xl font-bold text-gray-800">Get Matched Instantly</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Our algorithm finds the best available technicians near you. Review their profiles, ratings, and past work before confirming.
                    </p>
                </div>
            </div>

             {/* Step 4 (Reverse Layout) */}
             <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                <div className="md:w-1/2 flex justify-center">
                    <img src={hw5} alt="Track and Chat" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-4">04</div>
                    <h3 className="text-2xl font-bold text-gray-800">Track & Chat in real-time</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Know exactly when your helper will arrive. Use our in-app chat to discuss details and share location safely.
                    </p>
                </div>
            </div>

             {/* Step 5 */}
             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="md:w-1/2 flex justify-center">
                    <img src={hw6} alt="Pay Safely" className="w-full max-w-md object-contain drop-shadow-xl" />
                </div>
                <div className="md:w-1/2 space-y-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-4">05</div>
                    <h3 className="text-2xl font-bold text-gray-800">Pay & Review safely</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Complete payment via eSewa, Khalti, or Cash. After the job, rate your experience to help us maintain high-quality service.
                    </p>
                </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-orange-500 font-semibold uppercase tracking-wider mb-2">Testimonials</h3>
          <h2 className="text-3xl font-bold text-gray-900">Clients Feedback About Their <br/> <span className="text-orange-500">Experience</span> With Us</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition relative">
                    <div className="text-orange-500 text-4xl font-serif absolute top-4 left-6">“</div>
                    <p className="text-gray-600 italic mt-6 mb-6">
                        "The service was incredibly fast and the technician was very professional. I never thought finding a plumber in Kathmandu could be this easy!"
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div> {/* Avatar Placeholder */}
                        <div>
                            <h4 className="font-bold text-gray-900">Ram Sharma</h4>
                            <div className="flex text-yellow-400 text-sm">
                                <Star fill="currentColor" size={14} /><Star fill="currentColor" size={14} /><Star fill="currentColor" size={14} /><Star fill="currentColor" size={14} /><Star fill="currentColor" size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
                <h3 className="text-orange-500 font-semibold uppercase tracking-wider mb-2">Questions</h3>
                <h2 className="text-3xl font-bold text-gray-900">Frequently Asked <span className="text-orange-500">Questions</span></h2>
            </div>

            <div className="space-y-4">
                {['Are my details safe and fully secured?', 'Are technicians certified and background checked?', 'How is the service pricing calculated?', 'Can I cancel my service request?'].map((q, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full flex justify-between items-center p-5 text-left font-medium text-gray-800 hover:bg-gray-50 transition"
                        >
                            {q}
                            {openFaq === index ? <ChevronUp className="text-orange-500" /> : <ChevronDown className="text-gray-400" />}
                        </button>
                        {openFaq === index && (
                            <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed bg-gray-50/50">
                                Yes, absolutely. We prioritize your safety and data privacy above all else. All our technicians undergo a rigorous verification process.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
                <img src={footerLogo} alt="Kaam Chha" className="h-16 mb-6 bg-white/10 p-2 rounded w-auto" /> 
                <p className="text-gray-400 text-sm leading-relaxed">
                    Connecting Nepal's skilled hands with those who need them. The most trusted marketplace for local services.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold text-lg mb-6">Company</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li><Link to="/about" className="hover:text-orange-500">About Us</Link></li>
                    <li><Link to="/careers" className="hover:text-orange-500">Careers</Link></li>
                    <li><Link to="/contact" className="hover:text-orange-500">Contact</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6">Services</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li><Link to="/services/plumbing" className="hover:text-orange-500">Plumbing</Link></li>
                    <li><Link to="/services/electrical" className="hover:text-orange-500">Electrical</Link></li>
                    <li><Link to="/services/cleaning" className="hover:text-orange-500">Home Cleaning</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6">Contact</h4>
                <p className="text-gray-400 text-sm mb-2">Itahari-5, Sunsari, Nepal</p>
                <p className="text-gray-400 text-sm mb-2">+977 9812345678</p>
                <p className="text-gray-400 text-sm">support@kaamchha.com</p>
            </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Kaam Chha. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;