
const Footer = () => {
  return (
    <footer className="bg-white/8 footer-container0 backdrop-blur-sm py-2 border-t border-indigo-100/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center">
            <div className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Universiti Malaya Safe. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
