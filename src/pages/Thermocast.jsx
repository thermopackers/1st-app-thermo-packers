import React, { useState, useEffect, useRef } from 'react';
import ProductGallery3D from '../components/ProductGallery3D';

// Import your logos - update these paths to match your actual logo files
import headerLogo from '../../public/images/logo2.jpeg';
import footerLogo from '../../public/images/logo2.jpeg';

const Thermocast = () => {
  const [activeProcess, setActiveProcess] = useState('full-mould');
  const [activePattern, setActivePattern] = useState('white');
  const [isVideoPlaying, setIsVideoPlaying] = useState({
    'full-mould': false,
    'lost-foam': false
  });
  
  const sectionRefs = {
    'full-mould': useRef(null),
    'lost-foam': useRef(null),
    'patterns': useRef(null)
  };

  const scrollToSection = (section) => {
    sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleVideo = (videoType) => {
    setIsVideoPlaying(prev => ({
      ...prev,
      [videoType]: !prev[videoType]
    }));
  };

  // Animation for elements on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const processes = {
    'full-mould': {
      title: 'Full Mould Casting',
      description: 'Also known as the cavity-less casting method, full mould casting involves creating a foam pattern that is embedded in sand. When molten metal is poured, the foam vaporizes, leaving behind the metal casting.',
      steps: [
        'Pattern Creation: A polystyrene foam pattern is created in the shape of the desired part.',
        'Pattern Assembly: Multiple foam patterns may be assembled to form a complete mold.',
        'Sand Molding: The foam pattern is placed in a flask and surrounded by unbonded sand.',
        'Pouring: Molten metal is poured directly onto the foam pattern, which vaporizes upon contact.',
        'Cooling & Extraction: After cooling, the sand is removed, revealing the finished casting.'
      ],
      videoId: 'dQw4w9WgXQ', // Replace with actual video ID
      videoTitle: 'Full Mould Casting Process'
    },
    'lost-foam': {
      title: 'Lost Foam Casting',
      description: 'A type of evaporative-pattern casting process that uses a foam pattern embedded in unbonded sand. The pattern vaporizes when molten metal is poured into the mold.',
      steps: [
        'Pattern Creation: A foam pattern is coated with a refractory ceramic slurry.',
        'Drying: The coated pattern is dried to form a hard ceramic shell.',
        'Sand Compaction: The pattern is placed in a flask and surrounded with loose, unbonded sand.',
        'Metal Pouring: Molten metal is poured, vaporizing the foam and filling the cavity.',
        'Shakeout & Finishing: After cooling, the sand is shaken off and the ceramic coating is removed.'
      ],
      videoId: 'dQw4w9WgXQ', // Replace with actual video ID
      videoTitle: 'Lost Foam Casting Process'
    }
  };

  const patterns = {
    'white': {
      name: 'White Pattern Casting',
      description: 'Our specialty at ThermoCast. White patterns provide exceptional dimensional accuracy and surface finish, making them ideal for complex and high-precision components.',
      advantages: [
        'Superior surface finish',
        'Excellent dimensional accuracy',
        'Reduced porosity in final castings',
        'Ideal for intricate designs',
        'Minimal post-casting processing required'
      ],
      colorClass: 'bg-white text-gray-800',
      borderClass: 'border-gray-300'
    },
    'yellow': {
      name: 'Yellow Pattern Casting',
      description: 'Yellow patterns offer a balance between cost and performance, suitable for medium-complexity castings with good surface finish requirements.',
      advantages: [
        'Cost-effective for medium-volume runs',
        'Good surface finish',
        'Suitable for moderate complexity designs',
        'Reliable dimensional stability'
      ],
      colorClass: 'bg-yellow-100 text-gray-800',
      borderClass: 'border-yellow-300'
    },
    'black': {
      name: 'Black Pattern Casting',
      description: 'Black patterns are typically used for larger, less intricate castings where surface finish is less critical but durability is important.',
      advantages: [
        'Economical for large, simple castings',
        'High durability during handling',
        'Good for large volume production',
        'Suitable for thicker cross-sections'
      ],
      colorClass: 'bg-gray-800 text-white',
      borderClass: 'border-gray-600'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Logo in Header */}
              <div className="flex items-center">
                <img 
                  src={headerLogo} 
                  alt="ThermoCast Logo" 
                  className="h-10 w-auto" // Adjust height as needed
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzFBNTNCRiIvPgo8dGV4dCB4PSI2MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRoZXJtb0Nhc3Q8L3RleHQ+Cjwvc3ZnPg==";
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Thermo<span className="text-blue-600">Cast</span>
                </h1>
                <p className="text-xs text-gray-600">Precision Casting Solutions</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => scrollToSection('full-mould')}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Full Mould
              </button>
              <button 
                onClick={() => scrollToSection('lost-foam')}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Lost Foam
              </button>
              <button 
                onClick={() => scrollToSection('patterns')}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Patterns
              </button>
              <a 
                href="/contact" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Contact Us
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-gray-900 text-white py-20 px-4">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fadeIn">
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Thermo<span className="text-blue-400">Cast</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-200">
              Advanced Casting Solutions for Precision Engineering
            </p>
           <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto">
  Discover our specialized <span className="font-bold text-blue-300">White Pattern Casting</span> expertise – 
  delivering unparalleled precision and surface finish for complex metal components.
</p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => scrollToSection('full-mould')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Full Mould Casting
              </button>
              <button 
                onClick={() => scrollToSection('lost-foam')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Lost Foam Casting
              </button>
              <button 
                onClick={() => scrollToSection('patterns')}
                className="px-6 py-3 bg-blue-800 hover:bg-blue-900 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Pattern Specializations
              </button>
            </div>
          </div>
        </div>
          {/* <section id="products" className="py-20">
  <ProductGallery3D />
</section> */}
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-500 rounded-full animate-pulse opacity-20"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-blue-400 rounded-full animate-ping opacity-10"></div>
      </section>

      {/* Rest of your content remains the same... */}
      {/* Process Selection */}
        <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-center mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto animate-on-scroll opacity-0">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Our Casting Processes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(processes).map((key) => (
                <div 
                  key={key}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${activeProcess === key ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
                  onClick={() => setActiveProcess(key)}
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{processes[key].title}</h3>
                 
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Mould Casting Section */}
        <section ref={sectionRefs['full-mould']} className="mb-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-on-scroll opacity-0">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Full Mould Casting</h2>
                <p className="text-gray-600 mb-8">{processes['full-mould'].description}</p>
                
                <h3 className="text-xl font-bold text-gray-800 mb-4">Process Steps</h3>
                <ul className="space-y-4 mb-8">
                  {processes['full-mould'].steps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-blue-600 font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                    onClick={() => toggleVideo('full-mould')}
                  >
                    {isVideoPlaying['full-mould'] ? 'Pause Video' : 'Play Process Video'}
                  </button>
                  <a 
                    href="/contact" 
                    className="px-5 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300"
                  >
                    Request a Quote
                  </a>
                </div>
              </div>
              
              <div className="md:w-1/2 bg-gray-900 p-6 flex items-center justify-center">
                <div className="w-full max-w-lg">
                  <div className="relative overflow-hidden rounded-lg shadow-2xl">
                    <div className="aspect-w-16 aspect-h-9">
                      {isVideoPlaying['full-mould'] ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${processes['full-mould'].videoId}?autoplay=1`}
                          title={processes['full-mould'].videoTitle}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-64 md:h-80"
                        ></iframe>
                      ) : (
                        <div 
                          className="w-full h-64 md:h-80 bg-gray-800 flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => toggleVideo('full-mould')}
                        >
                          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 hover:bg-blue-700 transition-colors duration-300">
                            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          <p className="text-white text-lg font-semibold">Play Full Mould Casting Video</p>
                          <p className="text-gray-400 mt-2">min</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 text-center mt-4">{processes['full-mould'].videoTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lost Foam Casting Section */}
        <section ref={sectionRefs['lost-foam']} className="mb-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-on-scroll opacity-0">
            <div className="md:flex flex-row-reverse">
              <div className="md:w-1/2 p-8 md:p-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Lost Foam Casting</h2>
                <p className="text-gray-600 mb-8">{processes['lost-foam'].description}</p>
                
                <h3 className="text-xl font-bold text-gray-800 mb-4">Process Steps</h3>
                <ul className="space-y-4 mb-8">
                  {processes['lost-foam'].steps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-5 py-2.5 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors duration-300"
                    onClick={() => toggleVideo('lost-foam')}
                  >
                    {isVideoPlaying['lost-foam'] ? 'Pause Video' : 'Play Process Video'}
                  </button>
                  <a 
                    href="/contact" 
                    className="px-5 py-2.5 border-2 border-gray-800 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300"
                  >
                    Request a Quote
                  </a>
                </div>
              </div>
              
              <div className="md:w-1/2 bg-gray-800 p-6 flex items-center justify-center">
                <div className="w-full max-w-lg">
                  <div className="relative overflow-hidden rounded-lg shadow-2xl">
                    <div className="aspect-w-16 aspect-h-9">
                      {isVideoPlaying['lost-foam'] ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${processes['lost-foam'].videoId}?autoplay=1`}
                          title={processes['lost-foam'].videoTitle}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-64 md:h-80"
                        ></iframe>
                      ) : (
                        <div 
                          className="w-full h-64 md:h-80 bg-gray-900 flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => toggleVideo('lost-foam')}
                        >
                          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4 hover:bg-gray-600 transition-colors duration-300">
                            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          <p className="text-white text-lg font-semibold">Play Lost Foam Casting Video</p>
                          <p className="text-gray-400 mt-2">min</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 text-center mt-4">{processes['lost-foam'].videoTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pattern Specializations */}
        <section ref={sectionRefs['patterns']} className="mb-20">
          <div className="animate-on-scroll opacity-0">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Pattern Specializations</h2>
            <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
              At ThermoCast, we offer multiple pattern types to suit different casting requirements. 
              Our expertise lies in <span className="font-bold text-blue-600">White Pattern Casting</span>, which provides the highest precision and surface finish.
            </p>
            
            {/* Pattern Selection */}
     <div className="flex flex-wrap justify-center gap-4 mb-12">
  {Object.keys(patterns).map((key) => (
    <button
      key={key}
      className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 relative ${activePattern === key ? 'transform scale-105 shadow-lg' : ''} ${patterns[key].colorClass} border-2 ${patterns[key].borderClass}`}
      onClick={() => setActivePattern(key)}
    >
      {patterns[key].name}
      {key === 'white' && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          OUR SPECIALTY
        </span>
      )}
    </button>
  ))}
</div>
            
            {/* Pattern Details */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="md:flex">
                <div className={`md:w-2/5 p-10 ${patterns[activePattern].colorClass} ${patterns[activePattern].borderClass} border-r-2`}>
                  <h3 className="text-3xl font-bold mb-6">{patterns[activePattern].name}</h3>
                  <p className="mb-8 text-lg">{patterns[activePattern].description}</p>
                  
                {activePattern === 'white' && (
  <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 rounded-lg border-2 border-yellow-400 shadow-lg">
    <div className="flex items-center">
      <svg className="w-10 h-10 mr-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path>
      </svg>
      <div>
        <h4 className="font-bold text-xl mb-1">🌟 OUR CORE SPECIALIZATION</h4>
        <p className="text-blue-100">With decades of expertise, we are industry leaders in White Pattern Casting, delivering superior quality for mission-critical components.</p>
      </div>
    </div>
  </div>
)}
                </div>
                
                <div className="md:w-3/5 p-10">
                  <h4 className="text-2xl font-bold text-gray-800 mb-6">Key Advantages</h4>
                  <ul className="space-y-4">
                    {patterns[activePattern].advantages.map((advantage, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">{advantage}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-10 pt-8 border-t border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Applications</h4>
                    <div className="flex flex-wrap gap-3">
                      {activePattern === 'white' && ['Aerospace Components', 'Medical Implants', 'Automotive Engine Parts', 'Precision Valves', 'Hydraulic Components'].map((app, idx) => (
                        <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">{app}</span>
                      ))}
                      {activePattern === 'yellow' && ['Agricultural Equipment', 'Pump Housings', 'Machine Tool Parts', 'General Engineering Castings'].map((app, idx) => (
                        <span key={idx} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">{app}</span>
                      ))}
                      {activePattern === 'black' && ['Manhole Covers', 'Pipe Fittings', 'Construction Castings', 'Railway Components'].map((app, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-medium">{app}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
{/* Why White Pattern Section */}
<section className="mb-20 animate-on-scroll opacity-0">
  <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl shadow-xl p-10 border-2 border-blue-200">
    <div className="text-center mb-10">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Our White Pattern Casting?</h2>
      <p className="text-gray-600 max-w-3xl mx-auto">
        As specialists in White Pattern Casting, we offer unique advantages that set us apart from the competition.
      </p>
    </div>
    
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Industry-Leading Precision</h3>
        <p className="text-gray-600">Our white pattern technology achieves tolerances of ±0.1mm, making it ideal for aerospace, medical, and automotive applications.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Proven Track Record</h3>
        <p className="text-gray-600">We've successfully delivered over 10,000 white pattern castings for critical applications across multiple industries.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Technical Expertise</h3>
        <p className="text-gray-600">Our team includes certified casting engineers with specialized training in white pattern technology.</p>
      </div>
    </div>
  </div>
</section>
        {/* CTA Section */}
        <section className="py-16 animate-on-scroll opacity-0">
          <div className="bg-gradient-to-r from-blue-800 to-gray-900 rounded-2xl p-10 text-center text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Designs?</h2>
           <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
  Leverage our specialized <span className="font-bold text-yellow-300">White Pattern Casting</span> expertise for your most demanding projects. 
  Experience the highest standards of precision, quality, and reliability that only industry specialists can provide.
</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a 
                href="/contact" 
                className="px-8 py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
              >
                Request a Consultation
              </a>
              <a 
                href="tel:+919878165432" 
                className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-900 transition-all duration-300"
              >
                Call Our Experts
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer with Logo */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 flex items-center space-x-4">
              {/* Logo in Footer */}
              <div className="flex items-center">
                <img 
                  src={footerLogo} 
                  alt="ThermoCast Logo" 
                  className="h-12 w-auto" // Adjust height as needed
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0id2hpdGUiLz4KPHRleHQgeD0iNjAiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiMxQTUzQkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRoZXJtb0Nhc3Q8L3RleHQ+Cjwvc3ZnPg==";
                  }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Thermo<span className="text-blue-400">Cast</span>
                </h2>
                <p className="text-gray-400 mt-1">Precision Casting Solutions</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="mb-4">
                <p className="text-gray-300 font-medium">Contact Information</p>
                <p className="text-gray-400">Email: thermopackers@gmail.com</p>
                <p className="text-gray-400">Phone: +91 9878165432</p>
              </div>
              <p className="text-gray-400">www.thermopackers.com/thermocast</p>
              <p className="text-gray-400 mt-2">© {new Date().getFullYear()} ThermoCast. All rights reserved.</p>
            </div>
          </div>
          
          {/* Footer Navigation */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-400">Follow us:</p>
                <div className="flex space-x-4 mt-2">
                  <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                  <a href="#" className="text-gray-400 hover:text-white">YouTube</a>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/contact" className="text-blue-400 hover:text-blue-300">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
     <style jsx>{`
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes highlightPulse {
    0%, 100% { 
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); 
    }
    50% { 
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); 
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  
  .animate-fadeIn {
    animation: fadeInUp 1s ease-out forwards;
  }
  
  .highlight-animation {
    animation: highlightPulse 2s infinite;
  }
  
  .aspect-w-16 {
    position: relative;
    padding-bottom: 56.25%;
  }
  
  .aspect-w-16 > * {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
`}</style>
    </div>
  );
};

export default Thermocast;