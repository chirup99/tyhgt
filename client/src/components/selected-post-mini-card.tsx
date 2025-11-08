import { X } from 'lucide-react';
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
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getGradient = (idx: number) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-cyan-500 to-cyan-600',
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div 
      className={`relative flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br ${getGradient(index)} p-4 text-white shadow-lg`}
      data-testid={`mini-card-${post.id}`}
    >
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        data-testid={`button-remove-card-${post.id}`}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {post.authorDisplayName?.charAt(0) || post.authorUsername?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              {post.authorDisplayName || post.authorUsername || 'User'}
            </p>
          </div>
        </div>
        
        <p className="text-sm font-medium leading-snug flex-1 overflow-hidden">
          {truncateText(post.content, 80)}
        </p>
        
        <div className="mt-auto pt-2 border-t border-white/20">
          <span className="text-xs opacity-80">Post #{index + 1}</span>
        </div>
      </div>
    </div>
  );
}
