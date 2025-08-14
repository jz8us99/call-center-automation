export default function Footer() {
  return (
    <footer className="py-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <span className="text-xl font-bold text-black dark:text-white">
                JSX-ReceptionAI
              </span>
            </div>
            <p className="text-black dark:text-gray-300 mb-6">
              Never miss another customer with our professional receptionist
              services.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">
              Solutions
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  AI Receptionist
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Live Chat
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Appointment Booking
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">
              Industries
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Home Services
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Law Offices
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Healthcare
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Real Estate
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 JSX-ReceptionAI. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
