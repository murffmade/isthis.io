import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 5}s`,
      animationDelay: `${Math.random() * 5}s`,
      size: Math.random() * 3 + 2,
      opacity: Math.random() * 0.6 + 0.4
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: flake.opacity
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, Math.sin(flake.id) * 50]
          }}
          transition={{
            duration: parseFloat(flake.animationDuration),
            delay: parseFloat(flake.animationDelay),
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}