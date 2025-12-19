import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Bookmark, MousePointer, Check, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function Bookmarklet() {
  const [dragged, setDragged] = useState(false);

  const appUrl = window.location.origin;
  
  const bookmarkletCode = `javascript:(function(){var selected=[];var modal=document.createElement('div');modal.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;max-height:80vh;background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:999999;font-family:system-ui;overflow:hidden;';var overlay=document.createElement('div');overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999998;backdrop-filter:blur(4px);';overlay.onclick=function(){document.body.removeChild(overlay);document.body.removeChild(modal);};var header=document.createElement('div');header.style.cssText='padding:20px;border-bottom:1px solid #e5e7eb;background:#f9fafb;';header.innerHTML='<div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:linear-gradient(135deg,#1e293b,#334155);border-radius:10px;display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div><div style="font-weight:700;color:#1e293b;font-size:16px;">Is This Real?</div><div style="font-size:12px;color:#64748b;">Select content to verify</div></div></div>';var urlSection=document.createElement('div');urlSection.style.cssText='padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e5e7eb;';urlSection.innerHTML='<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:8px;">Or paste a URL:</div><div style="display:flex;gap:8px;"><input type="text" placeholder="https://..." style="flex:1;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;" id="urlInput"><button style="padding:8px 16px;background:#0f172a;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;" id="analyzeUrl">Analyze</button></div>';var content=document.createElement('div');content.style.cssText='max-height:300px;overflow-y:auto;padding:12px;';var imgs=Array.from(document.querySelectorAll('img, video')).filter(function(el){var rect=el.getBoundingClientRect();return rect.width>80&&rect.height>80;});if(imgs.length===0){content.innerHTML='<div style="text-align:center;padding:40px 20px;color:#94a3b8;"><div style="font-size:48px;margin-bottom:8px;">🔍</div><div style="font-size:14px;">No images or videos found</div></div>';}else{imgs.forEach(function(img,i){var item=document.createElement('div');item.style.cssText='display:flex;align-items:center;gap:12px;padding:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;margin-bottom:4px;';item.onmouseover=function(){this.style.background='#f1f5f9';};item.onmouseout=function(){this.style.background='transparent';};var checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='cb'+i;checkbox.style.cssText='width:18px;height:18px;cursor:pointer;';checkbox.onchange=function(e){e.stopPropagation();var src=img.currentSrc||img.src;if(this.checked){selected.push(src);}else{selected=selected.filter(function(s){return s!==src;});}counter.textContent=selected.length+' selected';analyzeBtn.disabled=selected.length===0;};var thumb=document.createElement('div');thumb.style.cssText='width:60px;height:60px;border-radius:6px;overflow:hidden;background:#f1f5f9;flex-shrink:0;';var thumbImg=document.createElement(img.tagName.toLowerCase());thumbImg.src=img.currentSrc||img.src;thumbImg.style.cssText='width:100%;height:100%;object-fit:cover;';thumb.appendChild(thumbImg);var label=document.createElement('label');label.htmlFor='cb'+i;label.style.cssText='flex:1;cursor:pointer;font-size:13px;color:#334155;';label.textContent=(img.alt||img.tagName.toLowerCase()).substring(0,40);item.appendChild(checkbox);item.appendChild(thumb);item.appendChild(label);item.onclick=function(e){if(e.target!==checkbox){checkbox.click();}};content.appendChild(item);});}var footer=document.createElement('div');footer.style.cssText='padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:#f9fafb;';var counter=document.createElement('span');counter.style.cssText='font-size:13px;color:#64748b;font-weight:500;';counter.textContent='0 selected';var buttons=document.createElement('div');buttons.style.cssText='display:flex;gap:8px;';var cancelBtn=document.createElement('button');cancelBtn.textContent='Cancel';cancelBtn.style.cssText='padding:8px 16px;background:white;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#475569;';cancelBtn.onclick=function(){document.body.removeChild(overlay);document.body.removeChild(modal);};var analyzeBtn=document.createElement('button');analyzeBtn.textContent='Analyze';analyzeBtn.disabled=true;analyzeBtn.style.cssText='padding:8px 20px;background:#0f172a;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;opacity:0.5;';analyzeBtn.onclick=function(){if(selected.length>0){selected.forEach(function(src){window.open('${appUrl}/?url='+encodeURIComponent(src),'_blank');});document.body.removeChild(overlay);document.body.removeChild(modal);}};buttons.appendChild(cancelBtn);buttons.appendChild(analyzeBtn);footer.appendChild(counter);footer.appendChild(buttons);modal.appendChild(header);modal.appendChild(urlSection);modal.appendChild(content);modal.appendChild(footer);document.body.appendChild(overlay);document.body.appendChild(modal);document.getElementById('analyzeUrl').onclick=function(){var url=document.getElementById('urlInput').value.trim();if(url){window.open('${appUrl}/?url='+encodeURIComponent(url),'_blank');document.body.removeChild(overlay);document.body.removeChild(modal);}};document.getElementById('urlInput').onkeydown=function(e){if(e.key==='Enter'){document.getElementById('analyzeUrl').click();}};})();`;

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
                  description: 'Choose one or more images/videos, or paste a URL directly'
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
              { icon: Zap, title: 'Multi-select', desc: 'Analyze multiple items at once' },
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