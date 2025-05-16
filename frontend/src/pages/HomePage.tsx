import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { Package, Map, MapPin, ArrowRight, Plane, DollarSign, Shield } from 'lucide-react';
import img  from '../asset/img2.jpg'

const HomePage: React.FC = () => {
  const { account, connectWallet, isConnecting } = useWeb3();

  return (
    <div className="flex flex-col space-y-12">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl overflow-hidden shadow-xl">
        <div className="container mx-auto px-6 py-16 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Decentralized Luggage Delivery Across Borders
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Connect with travelers who have extra luggage space and send your items safely and affordably using stablecoins on Base blockchain.
            </p>
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 text-lg"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet & Get Started'}
              </button>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/find-routes"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 text-lg flex items-center"
                >
                  Find Routes
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/create-route"
                  className="bg-indigo-800 text-white hover:bg-indigo-700 font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 text-lg flex items-center"
                >
                  Offer Space
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0">
          <img
              src={img}
              alt="Luggage delivery illustration"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How CarryChain Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-3 rounded-full mb-4">
                <Plane className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Travelers Post Routes</h3>
              <p className="text-gray-600">
                Travelers with extra luggage space post their routes, available space, and price per kg.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-3 rounded-full mb-4">
                <Package className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Shippers Book Space</h3>
              <p className="text-gray-600">
                Shippers find suitable routes and book space for their items, with payments secured in an escrow contract.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-3 rounded-full mb-4">
                <DollarSign className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Delivery & Payment</h3>
              <p className="text-gray-600">
                After verified delivery, the payment is released to the traveler from the smart contract escrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-gray-50 rounded-xl">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Benefits of CarryChain</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 flex items-start">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cost-Effective</h3>
                <p className="text-gray-600">
                  Save up to 70% compared to traditional shipping companies, especially for international deliveries.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p className="text-gray-600">
                  Stablecoin payments are held in smart contract escrow until delivery is verified by both parties.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 flex items-start">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Map className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
                <p className="text-gray-600">
                  Access routes to and from cities worldwide, especially useful for hard-to-reach destinations.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 flex items-start">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Trusted Network</h3>
                <p className="text-gray-600">
                  Our on-chain reputation system ensures you're dealing with reliable travelers and shippers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-xl">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ship or Travel?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of travelers and shippers making cross-border delivery more accessible and affordable.
          </p>
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 text-lg"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet & Get Started'}
            </button>
          ) : (
            <div className="flex justify-center space-x-4">
              <Link
                to="/find-routes"
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 text-lg"
              >
                Find Routes
              </Link>
              <Link
                to="/create-route"
                className="bg-indigo-800 text-white hover:bg-indigo-700 font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 text-lg"
              >
                Offer Space
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;