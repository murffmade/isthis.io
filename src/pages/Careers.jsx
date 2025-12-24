import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Rocket, Users, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import BottomNav from '@/components/mobile/BottomNav';

export default function Careers() {
  const openings = [
    {
      title: 'A.I. Trainer',
      department: 'Training',
      location: 'Remote',
      type: 'Contract / Part-time',
      description: 'Help improve our A.I. detection models by labeling content, identifying artifacts, and providing expert feedback on analysis results.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Is This Real?</h1>
                <p className="text-xs text-slate-500">Careers</p>
              </div>
            </a>
            <a
              href={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Build the Future of<br />Digital Trust
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Join our mission to make AI verification accessible to everyone. 
              We're a small, fast-moving team working on important problems.
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('Contact')}
              className="bg-slate-900 hover:bg-slate-800 h-12 px-8"
            >
              View Open Positions
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-12">Why Join Us</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Rocket,
                title: 'Impact',
                description: 'Your work directly helps people navigate an AI-generated world safely.'
              },
              {
                icon: Users,
                title: 'Small Team',
                description: 'Work closely with founders. Your voice matters from day one.'
              },
              {
                icon: Zap,
                title: 'Move Fast',
                description: 'Ship features quickly. See your impact immediately.'
              },
              {
                icon: Heart,
                title: 'Remote First',
                description: 'Work from anywhere. Flexible hours. Focus on output, not hours.'
              }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <value.icon className="w-10 h-10 text-slate-900 mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{value.title}</h4>
                <p className="text-slate-600 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Open Positions</h3>
          <div className="space-y-6">
            {openings.map((job, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-900 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">{job.title}</h4>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="px-3 py-1 bg-slate-100 rounded-full">{job.department}</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-full">{job.location}</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-full">{job.type}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.location.href = createPageUrl('Contact')}
                    variant="outline"
                    className="border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-slate-600">{job.description}</p>
              </motion.div>
            ))}
          </div>

          {/* General Application */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8 text-center"
          >
            <h4 className="text-xl font-semibold text-slate-900 mb-3">General Application</h4>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Don't see a specific role that fits? We're always looking for talented people. 
              Send us your resume and tell us how you'd like to contribute to our mission.
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('Contact')}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Submit General Application
            </Button>
          </motion.div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}