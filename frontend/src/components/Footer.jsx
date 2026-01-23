import { Heart, Zap, Shield, Globe, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  const features = [
    {
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      title: "Real-Time Sync",
      description: "Instant synchronization across all devices"
    },
    {
      icon: <Shield className="w-4 h-4 text-green-500" />,
      title: "Secure & Private",
      description: "No registration required, sessions auto-expire"
    },
    {
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      title: "Cross-Platform",
      description: "Works on desktop, tablet, and mobile devices"
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-200 py-5">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Features Section */}
        <div className="mb-5">
          <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
            Why Choose Online Clipboard?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" 
              >
                <div className="flex-shrink-0 mt-0.5">
                  {feature.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-semibold text-gray-900 text-sm leading-tight">{feature.title}</h5>
                  <p className="text-gray-600 text-xs leading-relaxed mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            {/* Copyright Text */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500" />
              <span>by Satish Das © 2024 Online Clipboard</span>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-3">
              <a
                href="https://www.linkedin.com/in/satishdas08/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                title="Connect on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/Satish-Das?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100"
                title="View GitHub Profile"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;