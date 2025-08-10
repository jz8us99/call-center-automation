interface Testimonial {
  avatar: string;
  name: string;
  company: string;
  rating: number;
  text: string;
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      avatar: '/api/placeholder/60/60',
      name: 'Sarah Johnson',
      company: 'Johnson & Associates Law',
      rating: 5,
      text: 'The AI receptionist has transformed our practice. We never miss a call and clients love the professional service.',
    },
    {
      avatar: '/api/placeholder/60/60',
      name: 'Michael Chen',
      company: 'Elite Home Services',
      rating: 5,
      text: 'Our booking rate increased by 40% since using the service. The ROI is incredible.',
    },
    {
      avatar: '/api/placeholder/60/60',
      name: 'Emma Rodriguez',
      company: 'Bella Spa & Wellness',
      rating: 5,
      text: 'Professional, reliable, and cost-effective. Our clients love the consistent, high-quality service.',
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
            What our customers say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-black dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {testimonial.company}
                  </p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-orange-500 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-black dark:text-gray-300 italic">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
