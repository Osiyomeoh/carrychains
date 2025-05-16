import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeb3 } from '../contexts/Web3Context';

const LandingPage = () => {
  const { connectWallet, account, isConnecting } = useWeb3();
  const [scrollY, setScrollY] = useState(0);
  
  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="bg-gray-900 min-h-screen text-white overflow-x-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(to right, #4f46e521 1px, transparent 1px), linear-gradient(to bottom, #4f46e521 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: `translateY(${scrollY * 0.2}px)` 
        }}></div>
      </div>
      
      {/* Floating gradient orbs */}
      <div className="fixed top-1/4 -left-20 w-60 h-60 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed top-1/2 -right-20 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
      <div className="fixed bottom-1/4 left-1/3 w-70 h-70 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 md:p-8">
        <div className="flex items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-2"></div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              CarryChain
            </span>
          </motion.div>
        </div>
        
        <div className="hidden md:flex space-x-6 items-center">
          <NavLink text="How It Works" href="#how-it-works" />
          <NavLink text="Features" href="#features" />
          <NavLink text="FAQ" href="#faq" />
          <NavLink text="About" href="#about" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {account ? (
            <button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg shadow-purple-500/20">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </button>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg shadow-purple-500/20"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </motion.div>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
      
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 pt-10 pb-20 md:pt-20 lg:flex lg:min-h-[75vh] lg:items-center">
        <div className="max-w-7xl mx-auto lg:flex lg:items-center lg:gap-12">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="block">Decentralized</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Luggage Delivery
                </span>
                <span className="block">on the Blockchain</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-lg">
                Share your journey, carry packages, earn crypto. The future of peer-to-peer delivery is here.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/find-routes">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-10 rounded-lg shadow-lg shadow-purple-500/20"
                  >
                    Find Routes
                  </motion.button>
                </Link>
                <Link to="/create-route">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto border-2 border-indigo-500 text-indigo-300 font-bold py-4 px-10 rounded-lg hover:bg-indigo-500/10 transition-colors duration-300"
                  >
                    Create Route
                  </motion.button>
                </Link>
              </div>
              
              <div className="mt-12 flex items-center space-x-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-r from-indigo-${i*100} to-purple-${i*100}`}></div>
                  ))}
                </div>
                <div className="text-gray-400">
                  <span className="text-white font-bold">1,200+</span> active users
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="hidden lg:block lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-75"></div>
                <div className="relative bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  {/* Dashboard mockup */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Active Routes</h3>
                    <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">+24% this week</div>
                  </div>
                  
                  {/* Routes cards */}
                  {[1, 2, 3].map(index => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">Lagos → Accra</div>
                        <div className="text-green-400">$25 USDC</div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <div>May 18, 2025</div>
                        <div>3kg available</div>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full py-3 rounded-lg bg-indigo-500/20 text-indigo-300 font-medium hover:bg-indigo-500/30 transition-colors duration-300">
                    View all routes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="relative px-6 md:px-12 py-16 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Why</span> Choose CarryChain?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Secure, transparent and efficient luggage delivery powered by blockchain technology</p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="💸"
              title="Earn While Traveling"
              description="Monetize your unused luggage space and earn crypto on routes you're already taking."
            />
            <FeatureCard
              icon="🔐"
              title="Secure Escrow"
              description="All payments are held in a smart contract until delivery is confirmed by both parties."
            />
            <FeatureCard
              icon="🌍"
              title="Global Community"
              description="Connect with travelers worldwide and build your reputation on the blockchain."
            />
            <FeatureCard
              icon="📱"
              title="Track in Real-time"
              description="Follow your package journey with blockchain-verified checkpoints and updates."
            />
            <FeatureCard
              icon="🔄"
              title="Smart Matching"
              description="Our algorithm finds the perfect carrier for your package based on route, timing, and ratings."
            />
            <FeatureCard
              icon="💲"
              title="No Hidden Fees"
              description="Transparent pricing with only a small platform fee that's clearly displayed upfront."
            />
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section id="how-it-works" className="relative px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">It Works</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Simple steps to start earning or sending packages using CarryChain</p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            <StepCard
              number="01"
              title="Connect Wallet"
              description="Connect your Web3 wallet like MetaMask or Coinbase Wallet to access the CarryChain platform."
              isLeft={true}
            />
            <StepCard
              number="02"
              title="Create or Find Routes"
              description="Travelers can create routes with available space. Shippers can search for suitable routes."
              isLeft={false}
            />
            <StepCard
              number="03"
              title="Secure Payment"
              description="Shippers pay through our secure escrow system that releases funds only after delivery confirmation."
              isLeft={true}
            />
            <StepCard
              number="04"
              title="Delivery & Verification"
              description="The package is picked up and delivered with blockchain verification at each step."
              isLeft={false}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-40"></div>
              <div className="relative bg-gray-800/80 rounded-2xl p-12 border border-gray-700">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Revolutionize</span> Delivery?
                </h2>
                <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
                  Join the future of peer-to-peer delivery. Connect your wallet, create your profile, and start earning or shipping today.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  {!account ? (
                    <motion.button 
                      onClick={connectWallet}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-purple-500/20"
                    >
                      Connect Wallet
                    </motion.button>
                  ) : (
                    <Link to="/find-routes">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-purple-500/20"
                      >
                        Get Started
                      </motion.button>
                    </Link>
                  )}
                  <Link to="#how-it-works">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="border-2 border-gray-600 text-gray-300 font-bold py-4 px-10 rounded-xl hover:bg-gray-700/30 transition-colors duration-300"
                    >
                      Learn More
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer id="about" className="relative px-6 md:px-12 pt-16 pb-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-2"></div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  CarryChain
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                Decentralized luggage delivery network powered by blockchain technology.
              </p>
              <div className="flex space-x-4">
                <SocialIcon name="twitter" />
                <SocialIcon name="discord" />
                <SocialIcon name="telegram" />
                <SocialIcon name="github" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Platform</h3>
              <ul className="space-y-2">
                <FooterLink text="Find Routes" to="/find-routes" />
                <FooterLink text="Create Route" to="/create-route" />
                <FooterLink text="My Deliveries" to="/my-deliveries" />
                <FooterLink text="My Routes" to="/my-routes" />
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <FooterLink text="Documentation" to="#" />
                <FooterLink text="Smart Contracts" to="#" />
                <FooterLink text="API" to="#" />
                <FooterLink text="Tokenomics" to="#" />
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <FooterLink text="About Us" to="#" />
                <FooterLink text="Careers" to="#" />
                <FooterLink text="Blog" to="#" />
                <FooterLink text="Contact" to="#" />
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2025 CarryChain. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <FooterLink text="Terms of Service" to="#" small={true} />
              <FooterLink text="Privacy Policy" to="#" small={true} />
              <FooterLink text="Legal" to="#" small={true} />
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating chat button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed z-50 bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>
    </div>
  );
};

// Helper Components
const NavLink = ({ text, href }) => (
  <motion.a 
    href={href}
    whileHover={{ scale: 1.05 }}
    className="text-gray-300 hover:text-white cursor-pointer"
  >
    {text}
  </motion.a>
);

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true, margin: "-50px" }}
    className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const StepCard = ({ number, title, description, isLeft }) => (
  <motion.div
    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true, margin: "-50px" }}
    className={`flex ${isLeft ? 'md:text-right md:flex-row-reverse' : 'text-left'}`}
  >
    <div className={`shrink-0 relative ${isLeft ? 'md:ml-6' : 'mr-6'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-md opacity-50"></div>
      <div className="relative z-10 w-14 h-14 bg-gray-800 border-2 border-indigo-500 rounded-full flex items-center justify-center font-bold text-xl">
        {number}
      </div>
    </div>
    <div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </motion.div>
);

const SocialIcon = ({ name }) => (
  <a className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-indigo-500 hover:text-white transition-colors duration-300 cursor-pointer">
    <span className="sr-only">{name}</span>
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  </a>
);

const FooterLink = ({ text, to, small = false }) => (
  <li>
    <Link to={to} className={`text-gray-400 hover:text-indigo-400 transition-colors duration-300 cursor-pointer ${small ? 'text-sm' : ''}`}>
      {text}
    </Link>
  </li>
);

export default LandingPage;