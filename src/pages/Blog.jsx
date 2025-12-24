import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import BottomNav from '@/components/mobile/BottomNav';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Blog() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['publishedArticles'],
    queryFn: async () => {
      const published = await base44.entities.Article.filter({ status: 'published' });
      return published.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

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

      {/* Content */}
      {isLoading ? (
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          </div>
        </section>
      ) : articles.length === 0 ? (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No articles yet</h3>
            <p className="text-slate-600">Check back soon for insights and updates</p>
          </div>
        </section>
      ) : (
        <>
          {/* Featured Post */}
          <section className="py-8 px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-900 transition-colors group cursor-pointer"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {articles[0].thumbnail_url && (
                    <img
                      src={articles[0].thumbnail_url}
                      alt={articles[0].title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="p-8 flex flex-col justify-center">
                    {articles[0].topic && (
                      <span className="text-sm text-slate-600 mb-2">{articles[0].topic}</span>
                    )}
                    <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-slate-700">
                      {articles[0].title}
                    </h3>
                    {articles[0].excerpt && (
                      <p className="text-slate-600 mb-6">{articles[0].excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(articles[0].created_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      {articles[0].author && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {articles[0].author}
                        </div>
                      )}
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
          {articles.length > 1 && (
            <section className="py-8 px-6">
              <div className="max-w-6xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">More Articles</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.slice(1).map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-900 transition-all group cursor-pointer"
                    >
                      {article.thumbnail_url && (
                        <img
                          src={article.thumbnail_url}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        {article.topic && (
                          <span className="text-xs text-slate-600 mb-2 block">{article.topic}</span>
                        )}
                        <h4 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-slate-700">
                          {article.title}
                        </h4>
                        {article.excerpt && (
                          <p className="text-sm text-slate-600 mb-4">{article.excerpt}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.created_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          {article.author && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {article.author}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}