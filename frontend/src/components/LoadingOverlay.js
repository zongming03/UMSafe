import UMSafeLogo from "../assets/UMSafeLogo.png";
import "../styles/LoadingOverlay.css";

const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100 to-white z-50 flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        
        {/* Glowing background effect */}
        <div className="absolute -inset-16 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>

        {/* Logo with floating animation */}
        <div className="relative">
          <img
            src={UMSafeLogo}
            alt="Loading Logo"
            className="w-72 h-auto animate-float drop-shadow-2xl"
          />
          
          {/* Particle effects */}
          <div className="absolute -inset-12 flex items-center justify-center">
            <div className="w-full h-full bg-blue-400/5 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Modern progress bar */}
        <div className="mt-8 relative w-48">
          <div className="h-0.5 w-full bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 animate-loading-bar"></div>
          </div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        </div>

        
        <div className="mt-4 text-blue-300 text-sm font-light tracking-wider animate-pulse">
          LOADING
        </div>
      </div>
    </div>
  );

export default LoadingOverlay;