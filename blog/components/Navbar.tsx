const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="text-2xl font-bold text-gray-800">Blog</a>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="/" className="border-b-2 border-transparent text-gray-600 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150 ease-in-out">
                Home
              </a>
              <a href="/posts" className="border-b-2 border-transparent text-gray-600 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150 ease-in-out">
                Posts
              </a>
              <a href="/categories" className="border-b-2 border-transparent text-gray-600 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150 ease-in-out">
                Categories
              </a>
              <a href="/about" className="border-b-2 border-transparent text-gray-600 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-150 ease-in-out">
                About
              </a>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="relative">
              <input
                type="text"
                className="bg-gray-100 text-gray-600 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Search post..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="sm:hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <a href="/" className="border-l-4 border-indigo-500 bg-indigo-50 text-indigo-700 block pl-3 pr-4 py-2 text-base font-medium">Home</a>
          <a href="/post" className="border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium">Posts</a>
          <a href="/categories" className="border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium">Categories</a>
          <a href="/about" className="border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium">About</a>
          <div className="mt-3 px-3">
            <input
              type="text"
              className="w-full bg-gray-100 text-gray-600 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Search articles..."
            />
            <div className="absolute inset-y-0 left-0 pl-6 pt-2 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;