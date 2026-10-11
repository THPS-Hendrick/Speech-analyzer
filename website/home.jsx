import React, { useState } from 'react';
import { 
  Menu, X, ChevronDown, CheckCircle, BarChart2, 
  Mic, PlayCircle, Star, ChevronRight, Activity, Clock
} from 'lucide-react';

const NAVIGATION = {
  services: [
    { name: 'Mic-Check App', href: '#' },
    { name: 'THPS Speech Assessment', href: '#' },
    { name: 'THPS Performance Plan', href: '#' },
    { name: 'Online Classes', href: '#' }
  ],
  articles: [
    { name: 'How the App works', href: '#' },
    { name: 'How the Method works', href: '#' },
    { name: 'How the Services Works', href: '#' },
    { name: 'Case Studies', href: '#' },
    { name: 'Communication Concepts', href: '#' },
    { name: 'Glossary', href: '#' }
  ]
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <a href="#" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#106030] rounded-lg flex items-center justify-center text-[#FFCC00]">
                <Activity size={24} />
              </div>
              <span className="font-bold text-xl text-[#106030] tracking-tight">Tom Hendrick</span>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-[#106030] font-medium text-sm transition-colors">Home</a>
            
            {/* Services Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-[#106030] font-medium text-sm transition-colors py-8">
                Services <ChevronDown size={16} />
              </button>
              <div className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left -translate-y-2 group-hover:translate-y-0">
                <div className="py-2">
                  {NAVIGATION.services.map((item) => (
                    <a key={item.name} href={item.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#106030]">
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Articles Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-[#106030] font-medium text-sm transition-colors py-8">
                Articles <ChevronDown size={16} />
              </button>
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left -translate-y-2 group-hover:translate-y-0">
                <div className="py-2">
                  {NAVIGATION.articles.map((item) => (
                    <a key={item.name} href={item.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#106030]">
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <a href="#" className="text-gray-600 hover:text-[#106030] font-medium text-sm transition-colors">Testimonials</a>
            <a href="#" className="text-gray-600 hover:text-[#106030] font-medium text-sm transition-colors">About</a>
            <a href="#" className="text-gray-600 hover:text-[#106030] font-medium text-sm transition-colors">Contact</a>
            
            <a href="#" className="bg-[#106030] text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-[#0c4a25] transition-colors">
              Member Login
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-[#106030] focus:outline-none p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg h-[calc(100vh-80px)] overflow-y-auto">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <a href="#" className="block px-3 py-3 text-base font-semibold text-gray-900 border-b border-gray-50">Home</a>
            
            {/* Mobile Services */}
            <div>
              <button 
                onClick={() => toggleDropdown('services')}
                className="flex items-center justify-between w-full px-3 py-3 text-base font-semibold text-gray-900 border-b border-gray-50"
              >
                Services <ChevronDown size={20} className={`transform transition-transform ${activeDropdown === 'services' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'services' && (
                <div className="bg-gray-50 px-4 py-2 space-y-1">
                  {NAVIGATION.services.map((item) => (
                    <a key={item.name} href={item.href} className="block py-2 text-sm text-gray-600">{item.name}</a>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Articles */}
            <div>
              <button 
                onClick={() => toggleDropdown('articles')}
                className="flex items-center justify-between w-full px-3 py-3 text-base font-semibold text-gray-900 border-b border-gray-50"
              >
                Articles <ChevronDown size={20} className={`transform transition-transform ${activeDropdown === 'articles' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'articles' && (
                <div className="bg-gray-50 px-4 py-2 space-y-1">
                  {NAVIGATION.articles.map((item) => (
                    <a key={item.name} href={item.href} className="block py-2 text-sm text-gray-600">{item.name}</a>
                  ))}
                </div>
              )}
            </div>

            <a href="#" className="block px-3 py-3 text-base font-semibold text-gray-900 border-b border-gray-50">Testimonials</a>
            <a href="#" className="block px-3 py-3 text-base font-semibold text-gray-900 border-b border-gray-50">About</a>
            <a href="#" className="block px-3 py-3 text-base font-semibold text-gray-900 border-b border-gray-50">Contact</a>
            
            <div className="pt-6 px-3">
              <a href="#" className="block w-full bg-[#106030] text-center text-white px-5 py-3 rounded-full font-bold text-base hover:bg-[#0c4a25]">
                Member Login
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const HeroSection = () => {
  return (
    <section className="bg-white overflow-hidden relative pt-12 pb-20 lg:pt-24 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-[#106030] text-sm font-semibold mb-6 border border-green-100">
              <Activity size={16} /> Data-Driven Methodology
            </span>
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl lg:leading-[1.15]">
              Data-Driven Public Speaking Training: <span className="text-[#106030]">Speak Confidently</span> and Master Your Delivery
            </h1>
            <p className="mt-6 text-base text-gray-600 sm:text-lg md:text-xl leading-relaxed">
              Traditional coaching relies on subjective opinions. We use real-time speech biometrics to diagnose your delivery, measure your progress, and build unshakable professional confidence.
            </p>
            <div className="mt-10 sm:flex sm:justify-center lg:justify-start gap-4 flex-col sm:flex-row">
              <a href="#" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-[#106030] bg-[#FFCC00] hover:brightness-105 shadow-md transition-all transform hover:-translate-y-0.5">
                Start Your Free Assessment
              </a>
              <a href="#" className="w-full sm:w-auto mt-3 sm:mt-0 flex items-center justify-center px-8 py-4 border-2 border-[#106030] text-base font-bold rounded-full text-[#106030] bg-transparent hover:bg-[#106030] hover:text-white transition-colors">
                Log In to Mic-Check
              </a>
            </div>
          </div>

          <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
            {/* Geoptie-style Data Dashboard Mockup */}
            <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 p-6 md:p-8 relative">
              <div className="absolute top-4 right-4 bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                Live Analysis
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-6">Voice Metrics Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="text-sm text-gray-500 font-medium mb-1">Words/Min</div>
                  <div className="text-3xl font-extrabold text-[#106030]">142</div>
                  <div className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Just Right
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="text-sm text-gray-500 font-medium mb-1">Pause Ratio</div>
                  <div className="text-3xl font-extrabold text-blue-600">18%</div>
                  <div className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Ideal Range
                  </div>
                </div>
              </div>

              {/* Mock Rainbow Graph */}
              <div className="mt-6">
                <div className="text-sm text-gray-500 font-medium mb-3">Vocal Variance Map</div>
                <div className="flex h-24 items-end gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 85].map((height, i) => (
                    <div key={i} className="w-full rounded-t-sm" style={{ 
                      height: `${height}%`, 
                      backgroundColor: i % 4 === 0 ? '#ef4444' : i % 4 === 1 ? '#eab308' : i % 4 === 2 ? '#3b82f6' : '#106030',
                      opacity: 0.8
                    }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                  <span>0:00</span>
                  <span>1:00</span>
                  <span>2:00</span>
                </div>
              </div>
              
              {/* Replace with actual image via GitHub later */}
              {/* <img src="https://github.com/your-repo/hero-dashboard.png" alt="Mic-Check Dashboard" className="w-full h-auto" /> */}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

const ProblemSolutionSection = () => {
  return (
    <section className="bg-[#FAF9F5] py-20 lg:py-28 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#106030] tracking-tight">
            Overcome Stage Fright with Objective Speech Metrics
          </h2>
          <div className="mt-4 w-24 h-1 bg-[#FFCC00] mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gray-200">
               {/* Replace with actual image via GitHub later */}
               <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" alt="Executive Coaching Session" className="w-full h-full object-cover" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center text-[#106030]">
                <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Methodology</p>
                <p className="text-[#106030] font-extrabold">Data-Backed</p>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 flex flex-col gap-10">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 flex items-start gap-3">
                <span className="text-[#FFCC00] mt-1"><CheckCircle size={24} fill="currentColor" className="text-white" /></span>
                Replace Subjective Feedback with Actionable Voice Data
              </h3>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed ml-9">
                Telling a professional to "just be more confident" does not work. True communication skills training requires measuring the actual mechanics of your voice to identify exactly where you lose your audience.
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-slate-900 flex items-start gap-3">
                <span className="text-[#106030] mt-1"><CheckCircle size={24} fill="currentColor" className="text-white" /></span>
                The Vocal Mechanics Method
              </h3>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed ml-9">
                Similar to how a biomechanist analyzes a golf swing, we measure your exact words-per-minute, pause ratios, and vocabulary simplicity. When you can see your data, you gain the control needed to eliminate nerves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CoreProductSection = () => {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Improve Your Communication Skills with the <span className="text-[#106030]">Mic-Check App</span>
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Stop guessing. Start measuring. The ultimate tool for modern speakers.
            </p>
          </div>
          <button className="bg-[#FFCC00] text-[#106030] px-8 py-4 rounded-full font-bold text-lg hover:brightness-105 shadow-md transition-all shrink-0">
            Unlock Premium for $9.90/mo
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Card 1 */}
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-[#106030] mb-8">
              <Activity size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Monitor Pace, Pauses, and Vocal Variety in Real-Time</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Track your progress with the Mic-Check App, a real-time vocal diagnostic tool for professionals. Instantly see your Pace, Mumble rate, and Pause percentages on a live Voice Graph.
            </p>
            
            {/* Visual Placeholder for UI */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-wider">
                <span>Pace</span>
                <span>Mumble</span>
                <span>Pause</span>
              </div>
              <div className="flex justify-between items-center font-extrabold text-2xl text-slate-900">
                <span className="text-[#106030]">127</span>
                <span className="text-red-500">3.9</span>
                <span className="text-blue-600">22%</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#106030] rounded-3xl p-8 md:p-12 border border-[#0d4d26] text-white hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
            
            <div className="w-14 h-14 bg-[#FFCC00] rounded-2xl shadow-sm flex items-center justify-center text-[#106030] mb-8 relative z-10">
              <Clock size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Practice with Guided Daily Training Courses</h3>
            <p className="text-green-50 text-lg leading-relaxed mb-8 relative z-10">
              Access specialized modules like "Mic-Check Daily," "Repeat + Count," and "ESL Level 1: Pronunciation" to build muscle memory. Upload past speeches or use the live timer to get an instant score summary.
            </p>
            
            {/* Visual Placeholder for UI */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/10 flex flex-col gap-3 relative z-10">
              <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                <div className="flex items-center gap-3 font-medium">
                  <Mic size={18} className="text-[#FFCC00]" /> Mic-Check Daily
                </div>
                <ChevronRight size={18} className="opacity-50" />
              </div>
              <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                <div className="flex items-center gap-3 font-medium">
                  <PlayCircle size={18} className="text-[#FFCC00]" /> Voice Choice: Intensity
                </div>
                <ChevronRight size={18} className="opacity-50" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const UpsellSection = () => {
  return (
    <section className="bg-[#F5F7F6] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#106030] tracking-tight">
            Online Speaking Courses and Professional Coaching
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            For professionals ready to accelerate their career with intensive, 1-on-1 guidance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">THPS Speech Assessments</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8 flex-grow">
              A comprehensive baseline analysis of your current speaking metrics to identify critical areas for improvement. Know exactly where you stand before you start training.
            </p>
            <a href="#" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-base font-bold rounded-full text-slate-700 bg-transparent hover:border-[#106030] hover:text-[#106030] transition-colors w-full sm:w-auto">
              Learn More
            </a>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-md border-t-4 border-t-[#FFCC00] flex flex-col h-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">The THPS Performance Plan</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8 flex-grow">
              A structured, four-session coaching program designed for corporate professionals seeking rapid, data-backed career advancement. Includes deep-dive analysis and custom drills.
            </p>
            <a href="#" className="inline-flex items-center justify-center px-6 py-3 text-base font-bold rounded-full text-white bg-[#106030] hover:bg-[#0c4a25] transition-colors shadow-md w-full sm:w-auto">
              Book a Performance Plan
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

const SocialProofSection = () => {
  return (
    <section className="bg-[#106030] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} size={24} className="text-[#FFCC00]" fill="currentColor" />)}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Proven Results for Corporate Professionals
          </h2>
          <h3 className="mt-4 text-xl text-green-100 font-medium">
            See How Data Transforms Delivery
          </h3>
          <p className="mt-4 text-sm text-green-200 uppercase tracking-widest font-bold">
            Backed by 68+ Five-Star Google Reviews
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Testimonial Video Placeholders */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white/10 rounded-2xl p-2 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer group">
              <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                {/* Image Placeholder */}
                <img src={`https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`} alt="Client Testimonial" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                <PlayCircle size={48} className="text-white relative z-10 group-hover:text-[#FFCC00] transition-colors" />
              </div>
              <div className="p-4">
                <p className="text-white italic text-sm mb-3">"The Mic-Check data completely changed how I approach board meetings. My confidence is through the roof."</p>
                <p className="text-[#FFCC00] font-bold text-sm">— Corporate Executive</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center text-left focus:outline-none"
      >
        <span className="text-lg font-bold text-slate-900 pr-4">{question}</span>
        <ChevronDown 
          size={24} 
          className={`text-[#106030] transform transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-gray-600 text-base leading-relaxed pb-4">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      question: "What is a good words-per-minute pace for a business presentation?",
      answer: "According to Mic-Check data, the ideal pace for a corporate presentation is between 130 and 150 words per minute. This allows enough time for the audience to digest complex information while maintaining engaging momentum."
    },
    {
      question: "How does the Mic-Check Premium membership work?",
      answer: "The Premium membership operates on a compounding model. For $9.90 per month (or $99 per year), you get full access to the live analyzer, advanced voice graphing, and all daily training modules."
    },
    {
      question: "Can I use the app for online speaking courses?",
      answer: "Absolutely. The Mic-Check App is integrated into our methodology. You can use it alongside our online modules like 'Mic-Check Daily' and 'ESL Level 1: Pronunciation' to track your progress over time."
    },
    {
      question: "What is the difference between subjective coaching and a THPS Speech Assessment?",
      answer: "Subjective coaching relies on a trainer's personal opinion of your delivery. A THPS Speech Assessment uses software to map your vocal biometrics, providing hard data on your pace, filler words, and vocal variance so we know exactly what to fix."
    }
  ];

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions About Business Presentation Training
          </h2>
        </div>
        <div className="bg-gray-50 rounded-3xl p-6 md:p-10 border border-gray-100">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#08331A] py-12 border-t-4 border-[#FFCC00]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-[#FFCC00]">
              <Activity size={20} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Tom Hendrick</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-green-100">
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Home</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Services</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Articles</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">About</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-green-300 text-xs">
          <p>&copy; {new Date().getFullYear()} Tom Hendrick. All rights reserved. Data-Driven Public Speaking Coaching.</p>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <CoreProductSection />
        <UpsellSection />
        <SocialProofSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
