import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

export default function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2025-12-26T23:59:59').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-8 px-6 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 border-b-4 border-amber-400"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              ⏰ Limited Time: $99 Lifetime Access
            </h3>
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <p className="text-amber-100 text-lg mb-6">
            Special holiday pricing ends December 26th - Lock in lifetime access forever!
          </p>

          <div className="flex items-center justify-center gap-3 md:gap-6 mb-6">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="bg-white rounded-xl shadow-2xl px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[90px]">
                  <div className="text-3xl md:text-5xl font-bold text-red-600 tabular-nums">
                    {String(item.value).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs md:text-sm font-semibold text-amber-200 mt-2 uppercase tracking-wide">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToPricing}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform"
          >
            Claim Lifetime Access Now
            <span className="animate-bounce">→</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}