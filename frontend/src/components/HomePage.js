import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Heart, Shield, Clock, Star, ArrowRight, CheckCircle, Users, Award, Globe } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [searchLocation, setSearchLocation] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hero carousel images
  const heroImages = [
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2512&q=80"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      navigate(`/search?location=${encodeURIComponent(searchLocation)}`);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      openAuth('register');
    }
  };

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Pet Owners' },
    { icon: Award, value: '5,000+', label: 'Verified Caregivers' },
    { icon: Heart, value: '50,000+', label: 'Bookings Completed', color: 'text-red-500' },
    { icon: Globe, value: '2', label: 'Countries Served' }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Trusted & Verified',
      description: 'All caregivers are background-checked and verified for your peace of mind.',
      color: 'text-green-500'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help you whenever you need assistance.',
      color: 'text-blue-500'
    },
    {
      icon: Star,
      title: 'Top-Rated Care',
      description: 'Connect with highly-rated caregivers based on real reviews from pet owners.',
      color: 'text-yellow-500'
    },
    {
      icon: MapPin,
      title: 'Local Network',
      description: 'Find trusted pet care services right in your neighborhood across Malaysia & Singapore.',
      color: 'text-purple-500'
    }
  ];

  const services = [
    {
      title: 'Pet Boarding',
      description: 'Overnight care in a loving home environment',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Dog Walking',
      description: 'Daily walks and exercise for your furry friend',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Pet Sitting',
      description: 'In-home care while you\'re away',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Pet Grooming',
      description: 'Professional grooming and spa services',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={image} 
                alt={`Pet care ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
              Find the Perfect
              <span className="block gradient-warm bg-clip-text text-transparent">
                Pet Care
              </span>
              Near You
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Connect with trusted, verified pet caregivers in Malaysia and Singapore. 
              Your furry friend deserves the best care while you're away.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative glass rounded-2xl p-2">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Enter your location (e.g., Singapore, Kuala Lumpur)"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/90 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary px-8 py-4 text-lg font-semibold whitespace-nowrap"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Find Care
                  </button>
                </div>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={handleGetStarted}
                className="btn btn-primary text-lg px-8 py-4 animate-pulse-hover"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              
              {!user && (
                <button
                  onClick={() => openAuth('register')}
                  className="btn btn-secondary text-lg px-8 py-4"
                >
                  Become a Caregiver
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-3">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg ${stat.color || 'text-purple-600'}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800">
              Our Pet Care Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From daily walks to overnight boarding, find the perfect care solution for your beloved pet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card group cursor-pointer">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                  <div className="flex items-center text-purple-600 font-medium">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800">
              Why Choose PetBnB?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing the safest, most reliable pet care experience for you and your furry family members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-4 p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 ${feature.color}`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with PetBnB is simple. Follow these easy steps to find the perfect care for your pet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Browse',
                description: 'Enter your location and browse through verified caregivers in your area.'
              },
              {
                step: '02',
                title: 'Connect & Book',
                description: 'Read reviews, chat with caregivers, and book the perfect care for your pet.'
              },
              {
                step: '03',
                title: 'Relax & Enjoy',
                description: 'Your pet is in loving hands. Get updates and photos throughout their stay.'
              }
            ].map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="relative">
                  <div className="text-6xl font-bold text-purple-100 mb-4">{step.step}</div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mt-8">{step.title}</h3>
                <p className="text-gray-600 max-w-sm mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to Give Your Pet the Best Care?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of happy pet owners who trust PetBnB for their pet care needs.
              Start your journey today!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={handleGetStarted}
                className="btn bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
              >
                Find Pet Care Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              {!user && (
                <button
                  onClick={() => openAuth('register')}
                  className="btn bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4"
                >
                  Become a Caregiver
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;