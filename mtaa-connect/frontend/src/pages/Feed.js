import React, { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CATS = [
  { key: 'all',           label: '🌍 All' },
  { key: 'story',         label: '📖 Stories' },
  { key: 'motivation',    label: '💪 Motivation' },
  { key: 'challenge',     label: '⚡ Challenges' },
  { key: 'education',     label: '🎓 Education' },
  { key: 'health',        label: '❤️ Health' },
  { key: 'anti_drugs',    label: '🚫 Anti-Drugs' },
  { key: 'community_news',label: '📰 News' },
  { key: 'jobs',          label: '💼 Jobs' },
];

const CAT_STYLE = {
  story:          { bg: '#f3eaf9', color: '#6c3483', label: 'Story' },
  motivation:     { bg: '#e8f5ee', color: '#1a7a4a', label: 'Motivation' },
  challenge:      { bg: '#fdecea', color: '#c0392b', label: 'Challenge' },
  education:      { bg: '#e8f0fb', color: '#1a5fa8', label: 'Education' },
  health:         { bg: '#fef3e2', color: '#e67e22', label: 'Health' },
  anti_drugs:     { bg: '#fdecea', color: '#c0392b', label: 'Anti-Drugs' },
  community_news: { bg: '#e8f0fb', color: '#1a5fa8', label: 'Community' },
  jobs:           { bg: '#e8f0fb', color: '#1a5fa8', label: 'Jobs' },
};

const AV_COLORS = ['#1a7a4a','#1a5fa8','#6c3483','#c0392b','#e67e22'];
const avColor = (name) => AV_COLORS[(name?.charCodeAt(0) || 0) % AV_COLORS.length];

// ── Post Card ─────────────────────────────────────
function PostCard({ post, onLike, onSave }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const style = CAT_STYLE[post.category] || CAT_STYLE.story;

  const loadComments = async () => {
    if (commentsLoaded || comments.length > 0) { setShowComments(v => !v); return; }
    try {
      const { data } = await API.get(`/posts/${post._id}`);
      setComments(data.post.comments || []);
      setCommentsLoaded(true);
      setShowComments(true);
    } catch { setShowComments(v => !v); }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    if (!user) { toast.error('Login to comment'); return; }
    try {
      const { data } = await API.post(`/posts/${post._id}/comment`, { content: commentText });
      setComments(prev => [...prev, data.comment]);
      setCommentText('');
    } catch { toast.error('Failed to post comment'); }
  };

  return (
    <div className="post-card" style={{ borderLeft: `4px solid ${style.color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div className="avatar" style={{ background: style.bg, color: style.color }}>
          {post.isAnonymous ? '??' : (post.author?.name || 'U').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{post.isAnonymous ? 'Anonymous' : (post.author?.name || 'Community Member')}</div>
          <div style={{ fontSize: '12px', color: '#5a7a60' }}>
            {post.location?.area || post.author?.area || 'Nairobi'} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span className="badge" style={{ background: style.bg, color: style.color }}>{style.label}</span>
          {post.status === 'featured' && <span className="badge badge-gold">⭐ Featured</span>}
          {post.isPinned && <span style={{ fontSize: '14px' }}>📌</span>}
        </div>
      </div>

      {/* Content */}
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', lineHeight: 1.4, marginBottom: '6px' }}>{post.title}</h3>
      <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, marginBottom: '10px' }}>
        {post.content?.length > 300 ? post.content.slice(0, 300) + '…' : post.content}
      </p>

      {/* Media */}
      {post.media?.length > 0 && (
        <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
          {post.media[0].type === 'image'
            ? <img src={post.media[0].url} alt="" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }} />
            : <video src={post.media[0].url} controls style={{ width: '100%', maxHeight: '220px' }} />
          }
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onLike(post._id)}
          style={{ color: post.isLiked ? '#c0392b' : '', borderColor: post.isLiked ? '#c0392b' : '', background: post.isLiked ? '#fdecea' : '' }}>
          {post.isLiked ? '❤️' : '🤍'} {post.likesCount || 0}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={loadComments}>
          💬 {(post.commentsCount || comments.length) || 0}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={async () => { await API.post(`/posts/${post._id}/share`); toast.success('Shared!'); }}>
          ↗ Share
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onSave(post._id)} style={{ marginLeft: 'auto' }}>
          {post.isSaved ? '🔖' : '📑'} Save
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          {comments.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="avatar avatar-sm" style={{ background: '#e8f5ee', color: '#1a7a4a', flexShrink: 0 }}>
                {(c.author?.name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ background: '#f5f9f5', borderRadius: '8px', padding: '7px 10px', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{c.author?.name || 'Community Member'}</div>
                <div style={{ fontSize: '13px', color: '#4a5568' }}>{c.content}</div>
              </div>
            </div>
          ))}
          {user && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontFamily: 'DM Sans', outline: 'none' }}
                placeholder="Write a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
              />
              <button className="btn btn-primary btn-sm" onClick={submitComment}>Post</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compose Box ───────────────────────────────────
function ComposeBox({ onPost }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('story');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) { toast.error('Please login to post a story'); return; }
    if (!title.trim() || !content.trim()) { toast.error('Add a title and content'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/posts', { title, content, category, isAnonymous, location: { area: user.area } });
      onPost(data.post);
      toast.success(data.message);
      setTitle(''); setContent(''); setExpanded(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="avatar" style={{ background: '#e8f5ee', color: '#1a7a4a', flexShrink: 0 }}>
          {user ? user.name.slice(0, 2).toUpperCase() : '?'}
        </div>
        {expanded
          ? <input className="form-input" placeholder="Story title…" value={title} onChange={e => setTitle(e.target.value)} style={{ margin: 0 }} />
          : <div onClick={() => setExpanded(true)} style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', color: '#aab5aa', cursor: 'pointer', background: 'var(--white)' }}>
              Share your story, experience or challenge with the community…
            </div>
        }
      </div>
      {expanded && (
        <div style={{ marginTop: '10px' }}>
          <textarea className="form-input" rows={4} placeholder="Tell your story in detail…" value={content} onChange={e => setContent(e.target.value)} style={{ marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto', flex: '1', minWidth: '140px', margin: 0 }} value={category} onChange={e => setCategory(e.target.value)}>
              {CATS.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5a7a60', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              Post anonymously
            </label>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>{loading ? '…' : 'Submit Post ↗'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feed Page ─────────────────────────────────────
export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const pg = reset ? 1 : page;
      const { data } = await API.get('/posts', { params: { page: pg, limit: 8, category: cat !== 'all' ? cat : undefined, sort } });
      setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
      setHasMore(pg < data.pages);
      if (!reset) setPage(pg + 1);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [cat, sort, page]);

  useEffect(() => { setPage(1); fetchPosts(true); }, [cat, sort]);

  useEffect(() => {
    API.get('/posts/trending').then(({ data }) => setTrending(data.posts || [])).catch(() => {});
  }, []);

  const handleLike = async (postId) => {
    try {
      const { data } = await API.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isLiked: data.liked, likesCount: data.likesCount } : p));
    } catch { toast.error('Login to like posts'); }
  };

  const handleSave = async (postId) => {
    try {
      const { data } = await API.post(`/posts/${postId}/save`);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isSaved: data.saved } : p));
      toast.success(data.saved ? 'Post saved!' : 'Post removed from saved');
    } catch { toast.error('Login to save posts'); }
  };

  const displayed = search ? posts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase())) : posts;

  return (
    <div className="page-grid">
      {/* Left */}
      <div className="left-sidebar">
        <div className="menu-section">Category</div>
        {CATS.map(c => (
          <button key={c.key} className={`menu-item ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(c.key)}>{c.label}</button>
        ))}
        <div className="divider" />
        <div className="menu-section">Sort By</div>
        {[{ key: 'latest', label: '🕐 Latest' }, { key: 'trending', label: '🔥 Trending' }, { key: 'featured', label: '⭐ Featured' }].map(s => (
          <button key={s.key} className={`menu-item ${sort === s.key ? 'active' : ''}`} onClick={() => setSort(s.key)}>{s.label}</button>
        ))}
      </div>

      {/* Center */}
      <div className="feed-col">
        <ComposeBox onPost={p => setPosts(prev => [p, ...prev])} />

        <input className="form-input" placeholder="🔍  Search posts…" value={search} onChange={e => setSearch(e.target.value)} />

        <div className="tabs">
          {CATS.slice(0, 6).map(c => <button key={c.key} className={`tab ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(c.key)}>{c.label}</button>)}
        </div>

        {loading && posts.length === 0
          ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
          : displayed.length === 0
            ? <div className="empty card card-pad"><div className="ei">📭</div><h3>No posts yet</h3><p>Be the first to share a story!</p></div>
            : <>
                {displayed.map(p => <PostCard key={p._id} post={p} onLike={handleLike} onSave={handleSave} />)}
                {hasMore && !search && (
                  <button className="btn btn-secondary btn-full" onClick={() => fetchPosts(false)} disabled={loading}>
                    {loading ? 'Loading…' : 'Load More'}
                  </button>
                )}
              </>
        }
      </div>

      {/* Right */}
      <div className="right-sidebar">
        <div className="card card-pad">
          <div className="font-syne" style={{ fontSize: '14px', marginBottom: '10px' }}>🔥 Trending Stories</div>
          {trending.slice(0, 6).map((p, i) => (
            <div key={p._id} style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--border)', minWidth: '18px' }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: '11px', color: '#5a7a60' }}>❤️ {p.likes?.length || 0} · 👁️ {p.views || 0}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card card-pad" style={{ background: 'linear-gradient(135deg,#1a7a4a,#0d4a2e)', color: 'white' }}>
          <div className="font-syne" style={{ marginBottom: '6px' }}>📢 Share Your Story</div>
          <p style={{ fontSize: '12px', opacity: 0.85, marginBottom: '12px' }}>Your experience could inspire someone in your community. Every story matters.</p>
          <a href="/register" className="btn btn-gold btn-full" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Join Mtaa Connect →</a>
        </div>
      </div>
    </div>
  );
}
