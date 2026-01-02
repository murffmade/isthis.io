import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Send, Inbox, Shield, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import SentGiftsList from '@/components/gifts/SentGiftsList';
import ReceivedGiftsList from '@/components/gifts/ReceivedGiftsList';
import BottomNav from '@/components/mobile/BottomNav';

export default function MyGifts() {
  const [highlightId, setHighlightId] = useState(null);
  const [activeTab, setActiveTab] = useState('sent');

  // Check for highlight parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightId(highlight);
      setActiveTab('sent');
    }
  }, []); // sent, received
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: sentGifts = [], isLoading: loadingSent } = useQuery({
    queryKey: ['sentGifts', currentUser?.email],
    queryFn: () => base44.entities.GiftCode.filter({ sender_email: currentUser.email }, '-created_date'),
    enabled: !!currentUser
  });

  const { data: receivedGifts = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['receivedGifts', currentUser?.email],
    queryFn: () => base44.entities.GiftCode.filter({ redeemed_by: currentUser.email }, '-redeemed_at'),
    enabled: !!currentUser
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
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
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Gift Management</p>
              </div>
            </a>
            <a
              href={createPageUrl('Home')}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">My Gift Cards</h2>
          <p className="text-slate-600">Manage gift cards you've sent and received</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'sent'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4 h-4" />
            Sent Gifts ({sentGifts.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'received'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Received Gifts ({receivedGifts.length})
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'sent' ? (
            <SentGiftsList gifts={sentGifts} loading={loadingSent} />
          ) : (
            <ReceivedGiftsList gifts={receivedGifts} loading={loadingReceived} />
          )}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav currentPage="gifts" />
    </div>
  );
}