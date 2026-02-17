import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bus, MapPin, Clock, Shield, Users, BarChart3, CheckCircle, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react';
import HeroBookingForm from '@/components/booking/HeroBookingForm';

const Index = () => {
  const features = [
    {
      icon: Bus,
      title: 'Modern Fleet',
      description: 'Travel in comfort with our well-maintained, air-conditioned buses.',
    },
    {
      icon: MapPin,
      title: 'Multiple Routes',
      description: 'Connecting major cities across Nigeria with convenient stops.',
    },
    {
      icon: Clock,
      title: 'On-Time Departure',
      description: 'We value your time with punctual departures and arrivals.',
    },
    {
      icon: Users,
      title: 'Professional Drivers',
      description: 'Experienced and trained drivers ensuring your safety.',
    },
    {
      icon: Shield,
      title: 'Safe Travel',
      description: 'Your safety is our priority with GPS tracking and insurance.',
    },
    {
      icon: BarChart3,
      title: 'Best Prices',
      description: 'Affordable fares with no hidden charges.',
    },
  ];

  const popularRoutes = [
    { from: 'Lagos', to: 'Abuja', price: '₦15,000' },
    { from: 'Lagos', to: 'Benin', price: '₦8,500' },
    { from: 'Abuja', to: 'Kano', price: '₦12,000' },
    { from: 'Port Harcourt', to: 'Lagos', price: '₦14,000' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Eagle Line</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Book Ticket
              </Link>
              <a href="#routes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Routes & Prices
              </a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="gradient-primary hover:opacity-90">
                <Link to="/auth">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Safe & Reliable Transport</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-foreground">Welcome to</span>
                <br />
                <span className="gradient-text">Eagle Line</span>
                <br />
                <span className="text-foreground">Transport Company</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-8">
                Travel across Nigeria with comfort, safety, and convenience. 
                Book your bus tickets online and enjoy a seamless journey.
              </p>
              
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">AC Buses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">GPS Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Online Booking</span>
                </div>
              </div>
            </div>

            {/* Right Side - Booking Form */}
            <div className="flex justify-center lg:justify-end">
              <HeroBookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section id="routes" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Popular Routes
            </h2>
            <p className="text-lg text-muted-foreground">
              Check out our most traveled routes with competitive prices
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularRoutes.map((route, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">{route.from}</span>
                  <div className="flex-1 mx-3 border-t-2 border-dashed border-muted-foreground/30" />
                  <span className="font-semibold">{route.to}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Starting from</span>
                  <span className="text-lg font-bold text-primary">{route.price}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">View All Routes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Travel With Us?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the best in road travel with Eagle Line Transport
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-glow transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl gradient-primary p-[2px]">
            <div className="rounded-3xl bg-card p-12">
              <Bus className="h-16 w-16 mx-auto text-primary mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Travel?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Book your bus ticket now and enjoy a comfortable journey to your destination.
              </p>
              <Button size="lg" className="h-12 px-8 gradient-primary hover:opacity-90" asChild>
                <Link to="/auth">Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 sm:px-6 lg:px-8 bg-sidebar text-sidebar-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Bus className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Eagle Line Transport</span>
              </div>
              <p className="text-sidebar-foreground/70 mb-4 max-w-sm">
                Your trusted partner for safe, comfortable, and affordable road travel across Nigeria.
              </p>
              <div className="flex gap-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sidebar-foreground/70">
                <li><Link to="/auth" className="hover:text-primary transition-colors">Book a Ticket</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Check Booking</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Hire a Bus</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">My Account</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sidebar-foreground/70">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+234 800 123 4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>info@eagleline.ng</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <span>123 Transport Way, Lagos, Nigeria</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-8">
            <p className="text-sm text-sidebar-foreground/50 text-center">
              © {new Date().getFullYear()} Eagle Line Transport Company. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
