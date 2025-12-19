import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Bookmark, MousePointer, Check, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function Bookmarklet() {
  const [dragged, setDragged] = useState(false);

  const appUrl = window.location.origin;
  
  const bookmarkletCode = `javascript:(function(){var imgs=document.querySelectorAll('img, video');if(imgs.length===0){alert('No images or videos found on this page');return;}var overlay=document.createElement('div');overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;';var msg=document.createElement('div');msg.style.cssText='color:white;font-size:20px;margin-bottom:20px;font-family:system-ui;';msg.textContent='Click on an image or video to analyze';overlay.appendChild(msg);var cancel=document.createElement('button');cancel.textContent='Cancel';cancel.style.cssText='padding:10px 20px;background:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;';cancel.onclick=function(){document.body.removeChild(overlay);};overlay.appendChild(cancel);document.body.appendChild(overlay);imgs.forEach(function(img){var clone=img.cloneNode();clone.style.cssText='cursor:pointer;border:3px solid transparent;transition:border 0.2s;';clone.onmouseover=function(){this.style.border='3px solid #3b82f6';};clone.onmouseout=function(){this.style.border='3px solid transparent';};clone.onclick=function(e){e.preventDefault();e.stopPropagation();var src=img.currentSrc||img.src;if(src){window.open('${appUrl}/?url='+encodeURIComponent(src),'_blank');}document.body.removeChild(overlay);};var rect=img.getBoundingClientRect();if(rect.width>50&&rect.height>50){var marker=document.createElement('div');marker.style.cssText='position:absolute;top:'+rect.top+'px;left:'+rect.left+'px;width:'+rect.width+'px;height:'+rect.height+'px;border:3px solid #3b82f6;box-sizing:border-box;cursor:pointer;z-index:1000000;transition:all 0.2s;';marker.onmouseover=function(){this.style.background='rgba(59,130,246,0.2)';};marker.onmouseout=function(){this.style.background='transparent';};marker.onclick=function(){var src=img.currentSrc||img.src;if(src){window.open('${appUrl}/?url='+encodeURIComponent(src),'_blank');}document.body.removeChild(overlay);};overlay.appendChild(marker);}});})();`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
                <p className="text-xs text-slate-500">AI content verification</p>
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

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Bookmark className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              One-Click Verification
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Install the bookmarklet to analyze any image or video on the web with a single click
            </p>
          </div>

          {/* Bookmarklet Button */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-center">
            <p className="text-white/80 text-sm mb-4">Drag this button to your bookmarks bar:</p>
            <a
              href={bookmarkletCode}
              onDragStart={() => setDragged(true)}
              className="inline-flex items-center gap-3 px-6 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl cursor-move"
              onClick={(e) => {
                e.preventDefault();
                alert('Please drag this button to your bookmarks bar instead of clicking it.');
              }}
            >
              <Shield className="w-6 h-6" />
              Analyze with Is This Real?
            </a>
            {dragged && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-center gap-2 text-green-400"
              >
                <Check className="w-5 h-5" />
                <span className="font-medium">Great! Now drop it in your bookmarks bar</span>
              </motion.div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              How it works
            </h3>
            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Drag the button above',
                  description: 'Click and drag the button to your browser\'s bookmarks bar'
                },
                {
                  step: '2',
                  title: 'Visit any webpage',
                  description: 'Browse the web normally - news sites, social media, anywhere'
                },
                {
                  step: '3',
                  title: 'Click the bookmarklet',
                  description: 'When you see an image or video to check, click the bookmarklet'
                },
                {
                  step: '4',
                  title: 'Select content',
                  description: 'Click on the image or video you want to analyze'
                },
                {
                  step: '5',
                  title: 'Get instant results',
                  description: 'The analysis opens in a new tab with full results'
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Globe, title: 'Works everywhere', desc: 'Any website, any browser' },
              { icon: Zap, title: 'Instant analysis', desc: 'One click to verify' },
              { icon: Shield, title: 'Always available', desc: 'No extension needed' }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 text-center">
                <feature.icon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h4 className="font-semibold text-slate-700 mb-1 text-sm">{feature.title}</h4>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Browser Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <MousePointer className="w-6 h-6 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-blue-900 font-medium mb-1">
              Compatible with all major browsers
            </p>
            <p className="text-xs text-blue-700">
              Chrome, Firefox, Safari, Edge, and more
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}