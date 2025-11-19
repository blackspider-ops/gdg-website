import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { BlogService } from '@/services/blogService';

interface BlogLikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  className?: string;
  showCount?: boolean;
}

const BlogLikeButton: React.FC<BlogLikeButtonProps> = ({
  postId,
  initialLikeCount = 0,
  className = '',
  showCount = true
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const hasLiked = await BlogService.hasUserLikedPost(postId);
        setIsLiked(hasLiked);
      } catch (error) {
        // Silently handle error
      }
    };

    checkLikeStatus();
  }, [postId]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await BlogService.toggleLike(postId);
      
      if (result.success) {
        setIsLiked(result.isLiked);
        setLikeCount(result.newCount);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center space-x-2 transition-all duration-200 ${
        isLiked 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-muted-foreground hover:text-red-500'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${className}`}
      title={isLiked ? 'Unlike this post' : 'Like this post'}
    >
      <Heart 
        size={18} 
        className={`transition-all duration-200 ${
          isLiked ? 'fill-current' : ''
        } ${isLoading ? 'animate-pulse' : ''}`} 
      />
      {showCount && (
        <span className="text-sm font-medium">
          {likeCount}
        </span>
      )}
    </button>
  );
};

export default BlogLikeButton;