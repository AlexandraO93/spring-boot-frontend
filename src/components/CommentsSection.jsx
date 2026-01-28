import {useEffect, useState} from "react";
import {API_BASE_URL} from "../config/api.js";
import "./CommentsSection.css"


const CommentsSection = ({postId, token, userId}) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchComments = async () => {
        if (!token || !postId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/comments/post/${postId}?size=5`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt);
            }

            const data = await res.json();
            setComments(data.content ?? []);
        } catch (err) {
            console.error("Fetch comment error: ", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("Vill du verkligen ta bort kommentaren?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
                method: "DELETE",
                headers: {Authorization: `Bearer ${token}`},
            });
            if (res.ok) fetchComments(); // Ladda om listan
        } catch (err) {
            console.error("Kunde inte ta bort:", err);
        }
    };

    const handleEdit = async (comment, currentContent) => {
        const newContent = prompt("Redigera din kommentar:", currentContent);
        if (!newContent || newContent === currentContent) return;

        try {
            const res = await fetch(`${API_BASE_URL}/comments/${comment.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({content: newContent}),
            });
            if (res.ok) fetchComments();
        } catch (err) {
            console.error("Kunde inte uppdatera:", err);
        }
    };

    const handleLike = async (commentId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                // Uppdatera listan så vi ser det nya antalet likes
                await fetchComments();
            }
        } catch (err) {
            console.error("Kunde inte gilla kommentaren:", err);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({postId, content: newComment, parentCommentId: null}),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("POST comment failed:", text);
                throw new Error("Kunde inte skapa kommentar");
            }


            setNewComment("");
            await fetchComments();
        } catch (err) {
            console.error("Create comment error:", err);
            setError("Kommentaren kunde inte sparas")
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    // if (loading) return <p>Laddar kommentarer...</p>;

    return (
        <div className="comments-section">
            {loading && comments.length === 0 && <p>Laddar kommentarer...</p>}

            <div className="new-comment">
                <input
                    type="text"
                    placeholder="Skriv en kommentar..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                />
                <button onClick={handleCommentSubmit}>Skicka</button>
            </div>
            {error && <p style={{color: "red", fontSize: "0.8rem"}}>{error}</p>}

            <ul className="comment-list">
                {comments.map((comment) => (
                    <li key={comment.id} className="comment-card">
                        <p><b>{comment.displayName}:</b> {comment.content}</p>
                        {String(comment.userId) === String(userId) && (
                            <div className="comment-actions">
                                <button onClick={() => handleEdit(comment, comment.content)}>✎</button>
                                <button onClick={() => handleDelete(comment.id)}>×</button>
                            </div>
                        )}
                        <div className="comment-footer">
                            <div className="like-section">
                                <button
                                    className={`like-btn ${comment.likedByMe ? 'liked' : ''}`}
                                    onClick={() => handleLike(comment.id)}
                                >
                                    {comment.likedByMe ? '❤️' : '🤍'} {comment.likeCount}
                                </button>
                            </div>
                            <small>{new Date(comment.createdAt).toLocaleString()}</small>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CommentsSection;
