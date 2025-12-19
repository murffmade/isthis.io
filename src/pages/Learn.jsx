import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, BookOpen, Video, FileText, ExternalLink } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Learn() {
  const resources = [
    {
      category: 'Getting Started',
      items: [
        {
          title: 'How to Verify an Image',
          type: 'Guide',
          icon: FileText,
          description: 'Step-by-step guide to checking if an image is AI-generated'
        },
        {
          title: 'Understanding Confidence Scores',
          type: 'Article',
          icon: BookOpen,
          description: 'Learn what our confidence scores mean and how to interpret them'
        },
        {
          title: 'Platform Overview (3 min)',
          type: 'Video',
          icon: Video,
          description: 'Quick video walkthrough of all features'
        }
      ]
    },
    {
      category: 'Advanced Topics',
      items: [
        {
          title: 'Detecting AI-Generated Faces',
          type: 'Guide',
          icon: FileText,
          description: 'Common tells in AI-generated portraits and people'
        },
        {
          title: 'Video Deepfake Detection',
          type: 'Article',
          icon: BookOpen,
          description: 'How to spot synthetic video content'
        },
        {
          title: 'Understanding Detection Signals',
          type: 'Guide',
          icon: FileText,
          description: 'Deep dive into the signals our AI looks for'
        }
      ]
    },
    {
      category: 'For Developers',
      items: [
        {
          title: 'API Documentation',
          type: 'Docs',
          icon: BookOpen,
          description: 'Complete API reference and integration guides',
          link: createPageUrl('APIDocs')
        },
        {
          title: 'Enterprise Solutions',
          type: 'Guide',
          icon: FileText,
          description: 'White-label and custom deployment options',
          link: createPageUrl('Enterprise')
        }
      ]
    }
  ];

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
                <p className="text-xs text-slate-500">Learning Center</p>
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
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Learn About AI Content Verification
            </h2>
            <p className="text-xl text-slate-600">
              Guides, tutorials, and resources to help you verify digital content
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {resources.map((section, i) => (
            <div key={i}>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">{section.category}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item, j) => (
                  <motion.a
                    key={j}
                    href={item.link || '#'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: j * 0.1 }}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-900 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <item.icon className="w-8 h-8 text-slate-900" />
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                        {item.type}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-slate-700">
                      {item.title}
                    </h4>
                    <p className="text-slate-600 text-sm mb-4">{item.description}</p>
                    <div className="flex items-center text-slate-900 text-sm font-medium group-hover:gap-2 transition-all">
                      <span>Read more</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Start Verifying?
          </h3>
          <p className="text-slate-300 mb-8">
            Try our free verification tool and see how easy it is
          </p>
          <a
            href={createPageUrl('Home')}
            className="inline-block px-8 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
          >
            Get Started
          </a>
        </div>
      </section>
    </div>
  );
}