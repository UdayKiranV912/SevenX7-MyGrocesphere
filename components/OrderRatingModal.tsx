
import React, { useState } from 'react';
import { Order } from '../types';

interface OrderRatingModalProps {
  order: Order;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export const OrderRatingModal: React.FC<OrderRatingModalProps> = ({ order, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
      if (rating === 0) return;
      onSubmit(rating, comment);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-scale-in">
         <div className="text-center mb-6">
             <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-white shadow-soft">
                 ⭐
             </div>
             <h3 className="text-xl font-black text-slate-900">Rate your Order</h3>
             <p className="text-xs text-slate-500 mt-1 font-medium">How was your experience with {order.storeName}?</p>
         </div>

         {/* Stars */}
         <div className="flex justify-center gap-2 mb-6">
             {[1, 2, 3, 4, 5].map((star) => (
                 <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                 >
                     <span className={`filter drop-shadow-sm ${
                         star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-slate-200'
                     }`}>★</span>
                 </button>
             ))}
         </div>

         {/* Comment */}
         <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-DEFAULT/50 resize-none mb-4"
            rows={3}
            placeholder="Tell us what you liked..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
         />

         <button 
            disabled={rating === 0}
            onClick={handleSubmit}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm shadow-xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
            Submit Review
         </button>
         
         <button onClick={onClose} className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">
             Skip Feedback
         </button>
      </div>
    </div>
  );
};
