import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Heart, Plus, X, ArrowLeft, MessageCircle, MoreHorizontal, Share2, Send } from 'lucide-react';
import { Post } from '../types';
import { ApiService } from '../services/ApiService';

const POST_COLORS = [
    'from-blue-500/20 to-purple-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-rose-500/20 to-orange-500/20',
    'from-indigo-500/20 to-blue-500/20'
];

function PeerSupport() {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newReplyContent, setNewReplyContent] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await ApiService.getPosts();
            setPosts(data);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;

        try {
            const color = POST_COLORS[Math.floor(Math.random() * POST_COLORS.length)];
            const newPost = await ApiService.createPost(newPostContent, color);
            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setShowCreateModal(false);
        } catch (error) {
            console.error("Failed to create post", error);
            alert("Failed to create post. Please try again.");
        }
    };

    const handleLike = async (e: React.MouseEvent, post: Post) => {
        e.stopPropagation(); // Prevent opening the post if clicking like
        try {
            // Optimistic update
            const updatedPosts = posts.map(p =>
                p.id === post.id ? { ...p, likes: p.likes + 1 } : p
            );
            setPosts(updatedPosts);
            if (selectedPost && selectedPost.id === post.id) {
                setSelectedPost({ ...selectedPost, likes: selectedPost.likes + 1 });
            }

            const response = await ApiService.likePost(post.id);
            // Correct update with server response (handling toggle)
            const correctedPosts = posts.map(p =>
                p.id === post.id ? { ...p, likes: response.likes } : p
            );
            setPosts(correctedPosts);
            if (selectedPost && selectedPost.id === post.id) {
                setSelectedPost({ ...selectedPost, likes: response.likes });
            }
        } catch (error) {
            console.error("Failed to like post", error);
            // Revert state if needed, can reload posts
            loadPosts();
        }
    };

    const handleReply = async () => {
        if (!selectedPost || !newReplyContent.trim()) return;

        try {
            const reply = await ApiService.replyToPost(selectedPost.id, newReplyContent);
            const updatedPost = {
                ...selectedPost,
                replies: [...selectedPost.replies, reply]
            };

            setSelectedPost(updatedPost);
            setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
            setNewReplyContent('');
        } catch (error) {
            console.error("Failed to reply", error);
            alert("Failed to post reply. Please try again.");
        }
    };

    return (
        <Layout
            headerContent={
                <div className="flex items-center gap-6">
                    <h1 className="h1-display text-2xl sm:text-3xl">
                        Peer Support
                    </h1>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sana-glass rounded-full border border-sana-glass-border shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-sana-text-muted text-xs font-medium tracking-wide">{12 + posts.length} Online</span>
                    </div>
                </div>
            }
        >
            <div className="relative w-full h-full">
                {/* Content */}
                <div className="absolute inset-0 overflow-y-auto pt-24 pb-20 px-4 sm:px-8 custom-scrollbar">
                    <div className="max-w-xl mx-auto space-y-8">

                        {/* Quote of the day (Header) */}
                        {!selectedPost && (
                            <div className="text-center py-6 space-y-2 animate-fade-in">
                                <p className="text-sana-text-muted text-sm font-light italic">
                                    "We rise by lifting others."
                                </p>
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto"></div>
                            </div>
                        )}

                        {loading && !posts.length ? (
                            <div className="flex justify-center py-20">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                {/* Detail View */}
                                {selectedPost ? (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <button
                                            onClick={() => setSelectedPost(null)}
                                            className="flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300 group"
                                        >
                                            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10">
                                                <ArrowLeft className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm">Back to feed</span>
                                        </button>

                                        {/* Main Post Detail */}
                                        <div className={`relative overflow-hidden bg-gradient-to-br ${selectedPost.color} backdrop-blur-xl border border-white/10 rounded-3xl p-8`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">A</div>
                                                    <div>
                                                        <p className="text-white font-medium">Anonymous</p>
                                                        <p className="text-white/40 text-xs">{selectedPost.timestamp}</p>
                                                    </div>
                                                </div>
                                                <button className="text-white/40 hover:text-white transition-colors">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap font-light">
                                                {selectedPost.content}
                                            </p>

                                            <div className="mt-8 flex items-center gap-6 pt-6 border-t border-white/10">
                                                <button
                                                    onClick={(e) => handleLike(e, selectedPost)}
                                                    className="flex items-center gap-2 text-white/60 hover:text-pink-400 transition-all duration-300"
                                                >
                                                    <Heart className="w-5 h-5" />
                                                    <span className="text-sm">{selectedPost.likes} Supports</span>
                                                </button>
                                                <button className="flex items-center gap-2 text-white/60 hover:text-blue-400 transition-all duration-300">
                                                    <Share2 className="w-5 h-5" />
                                                    <span className="text-sm">Share</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Replies Section */}
                                        <div className="space-y-4 pt-4">
                                            <h3 className="text-white/50 text-sm font-medium uppercase tracking-wider pl-2">
                                                Replies ({selectedPost.replies.length})
                                            </h3>

                                            {selectedPost.replies.map((reply) => (
                                                <div key={reply.id} className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-5 ml-4 relative">
                                                    <div className="absolute left-0 top-8 -translate-x-[22px] w-4 h-px bg-white/10"></div>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/60">A</div>
                                                        <span className="text-white/30 text-xs">{reply.timestamp}</span>
                                                    </div>
                                                    <p className="text-white/80 text-sm">{reply.content}</p>
                                                </div>
                                            ))}

                                            <div className="pt-4 ml-4 relative">
                                                <input
                                                    type="text"
                                                    value={newReplyContent}
                                                    onChange={(e) => setNewReplyContent(e.target.value)}
                                                    placeholder="Write a supportive reply..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all duration-300 text-sm"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                                />
                                                <button
                                                    onClick={handleReply}
                                                    disabled={!newReplyContent.trim()}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Feed View */
                                    <div className="space-y-5">
                                        {posts.map((post, i) => (
                                            <button
                                                key={post.id}
                                                onClick={() => setSelectedPost(post)}
                                                className="w-full text-left glass-card p-6 flex flex-col group relative overflow-hidden animate-fade-in-up"
                                                style={{ animationDelay: `${i * 100}ms` }}
                                            >
                                                {/* Subtle colored glow on hover */}
                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${post.color}`} />

                                                <div className="relative z-10 w-full">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/50 border border-white/5">A</div>
                                                            <span className="text-sana-text-muted text-xs">{post.timestamp}</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-sana-text text-sm sm:text-base leading-relaxed mb-4 line-clamp-3 font-light">
                                                        {post.content}
                                                    </p>

                                                    <div className="flex items-center gap-6 border-t border-white/5 pt-4 mt-2">
                                                        <div
                                                            className="flex items-center gap-2 text-white/40 group-hover:text-pink-300/80 transition-colors"
                                                            onClick={(e) => handleLike(e, post)}
                                                        >
                                                            <Heart className="w-4 h-4" />
                                                            <span className="text-xs font-medium">{post.likes}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-white/40 group-hover:text-blue-300/80 transition-colors">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span className="text-xs font-medium">{post.replies ? post.replies.length : 0} replies</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {posts.length === 0 && (
                                            <div className="text-center py-20 opacity-50">
                                                <p>Be the first to share something.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* FAB Create Button */}
                {!selectedPost && (
                    <div className="absolute bottom-8 right-8 z-50">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 text-white hover:scale-110 transition-transform duration-300"
                        >
                            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-scale-in relative overflow-hidden">
                            {/* Decorative background glow */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">New Post</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="How are you feeling today?"
                                    className="w-full h-48 bg-transparent border-none text-white text-lg placeholder-white/20 resize-none focus:ring-0 p-0 leading-relaxed"
                                    autoFocus
                                />

                                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                                    <div className="flex gap-2 text-white/30 text-sm">
                                        <span>Anonymous</span>
                                        <span>•</span>
                                        <span>Safe Space</span>
                                    </div>
                                    <button
                                        onClick={handleCreatePost}
                                        disabled={!newPostContent.trim()}
                                        className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout >
    );
}

export default PeerSupport;
