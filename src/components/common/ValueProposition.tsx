export default function ValueProposition() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-8">
              Total call coverage, powered by{' '}
              <span className="text-orange-500">advanced AI</span>
            </h2>
            <p className="text-xl text-black dark:text-gray-300 mb-8">
              Our intelligent AI system provides professional, efficient call
              handling that ensures every customer receives exceptional service.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">95%</div>
              <div className="text-black dark:text-gray-300">
                Customer satisfaction
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                4.9/5
              </div>
              <div className="text-black dark:text-gray-300">Clutch rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                24/7
              </div>
              <div className="text-black dark:text-gray-300">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                4.8/5
              </div>
              <div className="text-black dark:text-gray-300">
                Trustpilot rating
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
