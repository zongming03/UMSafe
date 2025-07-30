const Footer = () => {
  return (
    <footer className="bg-white py-4 border-t border-gray-200 w-full">
      <div className="flex justify-center items-center">
        <div className="text-sm text-gray-500 text-center w-full">
          &copy; {new Date().getFullYear()} Universiti Malaya Safe. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
