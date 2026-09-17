import React from 'react';
import { MessageCircle, CheckCircle2, MapPin, Tag, Award, Sparkles, Scale, IndianRupee } from 'lucide-react';
import { generateWhatsAppLink, formatCurrency, formatKg, formatDate } from '../utils/helpers';

export default function PostCard({ post, isOwner, onDealingDone }) {
  const isProduce = post.category === 'produce';

  // WhatsApp negotiation template
  const defaultMessage = isProduce
    ? `Hello ${post.user_name || 'Farmer'}, I saw your listing for "${post.title}" (${post.quantity}kg ${post.crop_type} at ₹${post.price_per_unit}/kg) on Agro-Market. I am interested in purchasing.`
    : `Hello ${post.user_name || 'Buyer'}, I saw your requirement for "${post.title}" (${post.quantity}kg ${post.crop_type} at ₹${post.price_per_unit}/kg) on Agro-Market. I have stock available and can supply.`;

  const waLink = generateWhatsAppLink(post.whatsapp_number || post.phone, defaultMessage);

  const getGradeBadge = (grade) => {
    if (!grade || grade === 'N/A') return null;
    let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (grade === 'B') color = 'bg-amber-50 text-amber-700 border-amber-200';
    if (grade === 'C') color = 'bg-orange-50 text-orange-700 border-orange-200';

    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs ${color}`}>
        <Award className="w-3.5 h-3.5" />
        Grade {grade} (AI Verified)
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden flex flex-col justify-between ${
      isProduce ? 'border-slate-200/80 hover:border-emerald-300' : 'border-slate-200/80 hover:border-purple-300'
    }`}>
      <div>
        {/* Produce Image (if available) */}
        {post.image_url ? (
          <div className="relative h-48 w-full overflow-hidden bg-slate-100 group">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute top-3 right-3">
              {getGradeBadge(post.grade)}
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
              {post.crop_type}
            </div>
          </div>
        ) : (
          <div className="p-5 pb-0 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isProduce ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
            }`}>
              <Tag className="w-3 h-3" />
              {isProduce ? 'Available Produce' : 'Buyer Requirement'}
            </span>
            {getGradeBadge(post.grade)}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-bold text-lg text-slate-900 line-clamp-1">
              {post.title}
            </h3>
          </div>

          <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {post.description || 'Quality produce sourced directly from local farm clusters.'}
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 shadow-xs border border-slate-200/60">
                <Scale className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">
                  {isProduce ? 'Quantity' : 'Needed'}
                </p>
                <p className="text-sm font-bold text-slate-800">{formatKg(post.quantity)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 shadow-xs border border-slate-200/60">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">
                  {isProduce ? 'Price / kg' : 'Budget / kg'}
                </p>
                <p className="text-sm font-bold text-slate-800">₹{post.price_per_unit}<span className="text-xs text-slate-500 font-normal">/kg</span></p>
              </div>
            </div>
          </div>

          {/* Author info & village/city location */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[130px]">
              {post.user_name || post.name || (isProduce ? 'Farmer' : 'Buyer')}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 max-w-[160px] truncate" title={post.city_or_village ? `${post.city_or_village} (${post.district})` : post.district}>
              <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{post.city_or_village || post.district || 'Karnataka'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0">
        {isOwner ? (
          <button
            onClick={() => {
              if (window.confirm('Mark this listing as dealt? It will be archived from active marketplace feeds.')) {
                onDealingDone(post.id);
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Dealing Done (Complete Deal)
          </button>
        ) : (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all font-display tracking-wide"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            Connect on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
