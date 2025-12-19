import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Blog() {
  const posts = [
    {
      title: 'How AI-Generated Images Are Fooling Everyone',
      excerpt: 'A deep dive into the most common AI image generation techniques and how to spot them.',
      date: '2024-12-15',
      author: 'Sarah Chen',
      category: 'AI Detection',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80'
    },
    {
      title: 'The Rise of Deepfakes: What You Need to Know',
      excerpt: 'Understanding video manipulation technology and its implications for society.',
      date: '2024-12-10',
      author: 'Michael Rodriguez',
      category: 'Deepfakes',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'
    },
    {
      title: 'Protecting Parents from AI-Generated Scams',
      excerpt: 'How to help older family members identify fake content and stay safe online.',
      date: '2024-12-05',
      author: 'Emma Watson',
      category: 'Safety',
      image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80'
    },
    {
      title: 'The Technology Behind AI Content Detection',
      excerpt: 'A technical overview of how machine learning models identify synthetic content.',
      date: '2024-11-28',
      author: 'David Kim',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80'
    },
    {
      title: 'Case Study: Newsroom Uses AI Verification',
      excerpt: 'How a major news organization integrated AI verification into their workflow.',
      date: '2024-11-20',
      author: 'Jessica Martinez',
      category: 'Case Studies',
      image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'
    },
    {
      title: 'The Future of Digital Trust',
      excerpt: 'Exploring what comes next in AI detection and content verification.',
      date: '2024-11-15',
      author: 'Alex Thompson',
      category: 'Future',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80'
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
                <p className="text-xs text-slate-500">Blog</p>
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
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Insights & Updates
            </h2>
            <p className="text-xl text-slate-600">
              Stories, research, and news about AI content verification
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-900 transition-colors group cursor-pointer"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <img
                src={posts[0].image}
                alt={posts[0].title}
                className="w-full h-full object-cover"
              />
              <div className="p-8 flex flex-col justify-center">
                <span className="text-sm text-slate-600 mb-2">{posts[0].category}</span>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-slate-700">
                  {posts[0].title}
                </h3>
                <p className="text-slate-600 mb-6">{posts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(posts[0].date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {posts[0].author}
                  </div>
                </div>
                <div className="flex items-center text-slate-900 font-medium group-hover:gap-2 transition-all">
                  <span>Read article</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* More Posts */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">More Articles</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.slice(1).map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-900 transition-all group cursor-pointer"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <span className="text-xs text-slate-600 mb-2 block">{post.category}</span>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-slate-700">
                    {post.title}
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}