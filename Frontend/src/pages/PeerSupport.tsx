import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Heart, Plus, X, ArrowLeft, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';

interface Post {
    id: string;
    content: string;
    preview: string;
    timestamp: string;
    replies: Reply[];
    likes: number;
    color: string;
}

interface Reply {
    id: string;
    content: string;
    timestamp: string;
}

const POST_COLORS = [
    'from-blue-500/20 to-purple-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-rose-500/20 to-orange-500/20',
    'from-indigo-500/20 to-blue-500/20'
];

// Mock data - calm, supportive posts
const mockPosts: Post[] = [
    {
        id: '1',
        content: "Today was hard. I couldn't get out of bed until noon. But I did get up. And that's something.",
        preview: "Today was hard. I couldn't get out of bed...",
        timestamp: '2h ago',
        likes: 12,
        color: POST_COLORS[0],
        replies: [
            {
                id: 'r1',
                content: "That is something. Getting up at all takes strength. I'm proud of you.",
                timestamp: '1h ago'
            }
        ]
    },
    {
        id: '2',
        content: "I've been feeling disconnected from everyone lately. Like I'm watching life happen through a window. Does anyone else feel this way?",
        preview: "I've been feeling disconnected from everyone...",
        timestamp: '5h ago',
        likes: 8,
        color: POST_COLORS[3],
        replies: [
            {
                id: 'r2',
                content: "Yes. Sometimes it feels like I'm underwater and everything is muffled. You're not alone in this.",
                timestamp: '4h ago'
            },
            {
                id: 'r3',
                content: "I know that feeling. It's okay to feel this way. Be gentle with yourself.",
                timestamp: '3h ago'
            }
        ]
    },
    {
        id: '3',
        content: "Small win today: I called a friend I've been avoiding. We talked for 5 minutes. It wasn't perfect but I did it.",
        preview: "Small win today: I called a friend...",
        timestamp: '8h ago',
        likes: 24,
        color: POST_COLORS[1],
        replies: []
    },
    {
        id: '4',
        content: "The quiet mornings are the hardest. That's when everything feels too heavy. I just wanted to share that somewhere.",
        preview: "The quiet mornings are the hardest...",
        timestamp: '12h ago',
        likes: 15,
        color: POST_COLORS[2],
        replies: [
            {
                id: 'r4',
                content: "I understand. Mornings can be overwhelming. Thank you for sharing this.",
                timestamp: '11h ago'
            }
        ]
    }
];

function PeerSupport() {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [posts, setPosts] = useState<Post[]>(mockPosts);

    const handleCreatePost = () => {
        if (!newPostContent.trim()) return;

        const newPost: Post = {
            id: Date.now().toString(),
            content: newPostContent,
            preview: newPostContent.slice(0, 60) + (newPostContent.length > 60 ? '...' : ''),
            timestamp: 'Just now',
            likes: 0,
            color: POST_COLORS[Math.floor(Math.random() * POST_COLORS.length)],
            replies: []
        };

        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setShowCreateModal(false);
    };

    return (
        <Layout
            headerContent={
                <>
                    <h1 className="text-xl sm:text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
                        Peer Support
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white/40 text-xs">24 Online</span>
                    </div>
                </>
            }
        >
            <div className="relative w-full h-full bg-slate-900">
                {/* Background */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black"></div>

                {/* Content */}
                <div className="absolute inset-0 overflow-y-auto pt-20 pb-20 px-4 sm:px-8 custom-scrollbar">
                    <div className="max-w-xl mx-auto space-y-8">

                        {/* Quote of the day (Header) */}
                        {!selectedPost && (
                            <div className="text-center py-6 space-y-2">
                                <p className="text-white/60 text-sm font-light italic">
                                    "We rise by lifting others."
                                </p>
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>
                            </div>
                        )}

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
                                        <button className="flex items-center gap-2 text-white/60 hover:text-pink-400 transition-all duration-300">
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

                                    <div className="pt-4 ml-4">
                                        <input
                                            type="text"
                                            placeholder="Write a supportive reply..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all duration-300 text-sm"
                                        />
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
                                        className="w-full group relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all duration-500 text-left hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        {/* Subtle colored glow on hover */}
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${post.color}`} />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/70">A</div>
                                                    <span className="text-white/30 text-xs">{post.timestamp}</span>
                                                </div>
                                            </div>

                                            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 line-clamp-3 font-light">
                                                {post.content}
                                            </p>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-white/40 group-hover:text-pink-300/70 transition-colors">
                                                    <Heart className="w-4 h-4" />
                                                    <span className="text-xs">{post.likes}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/40 group-hover:text-blue-300/70 transition-colors">
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span className="text-xs">{post.replies.length} replies</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
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
        </Layout>
    );
}

export default PeerSupport;
