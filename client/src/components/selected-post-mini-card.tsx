import { X, Play } from 'lucide-react';
import { Button } from './ui/button';

interface SelectedPostMiniCardProps {
  post: {
    id: string | number;
    authorUsername?: string;
    authorDisplayName?: string;
    content: string;
  };
  onRemove: () => void;
  index: number;
}

export function SelectedPostMiniCard({ post, onRemove, index }: SelectedPostMiniCardProps) {
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', icon: '💼' },
      { from: 'from-purple-500', to: 'to-purple-600', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  const gradient = getGradient(index);
  const authorName = post.authorDisplayName || post.authorUsername || 'Trading Insight';

  return (
    <div 
      className={`relative w-full rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} p-6 text-white shadow-xl hover:shadow-2xl transition-shadow`}
      data-testid={`mini-card-${post.id}`}
    >
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110"
        data-testid={`button-remove-card-${post.id}`}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col space-y-4">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{gradient.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
              {authorName}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold leading-tight">
            Latest in Trading
          </h3>
          <p className="text-sm leading-relaxed opacity-95 line-clamp-3">
            {truncateText(post.content, 120)}
          </p>
        </div>
        
        {/* Action Button */}
        <button 
          className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors w-fit shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            // Preview action could go here
          }}
        >
          <Play className="w-4 h-4 fill-current" />
          Read Now
        </button>
      </div>
    </div>
  );
}
