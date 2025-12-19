import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Target, Users, Lightbulb, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
                <p className="text-xs text-slate-500">About Us</p>
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
              Building Trust in a Digital World
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              We're on a mission to help everyone distinguish between authentic and AI-generated content, 
              making the internet a more trustworthy place for all.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Target,
                title: 'Our Mission',
                description: 'Empower everyone with tools to verify digital content and make informed decisions online.'
              },
              {
                icon: Users,
                title: 'Accessibility First',
                description: 'AI verification should be accessible to everyone, not just tech experts or large organizations.'
              },
              {
                icon: Lightbulb,
                title: 'Transparency',
                description: 'We provide clear confidence scores and explanations, never claiming absolute certainty.'
              },
              {
                icon: Heart,
                title: 'User Privacy',
                description: 'Your data and uploads are treated with respect. We don\'t store content without permission.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <item.icon className="w-10 h-10 text-slate-900 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-lg max-w-none"
          >
            <h3 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Is This Real? was born from a simple observation: as AI-generated content became 
              increasingly sophisticated, the tools to verify it remained inaccessible to everyday people. 
              Parents, grandparents, journalists, and concerned citizens needed a simple way to check 
              what's real online.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              We built a platform that combines cutting-edge AI detection technology with an interface 
              so simple that anyone can use it. No technical knowledge required, no complicated reports 
              to decipher—just clear, honest assessments of whether content appears authentic or AI-generated.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Today, Is This Real? is trusted by thousands of users worldwide, from individuals protecting 
              their families from misinformation to enterprises integrating our API into their platforms. 
              But our mission remains the same: make AI verification accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { number: '100K+', label: 'Verifications Completed' },
              { number: '95%', label: 'Accuracy Rate' },
              { number: '24/7', label: 'Always Available' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}