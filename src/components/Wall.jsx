import {useEffect, useState} from "react";
import {useAuth} from "../context/useAuth";
import "./Feed.css";
import "./Wall.css";
import {API_BASE_URL} from "../config/api.js";
import {useParams} from "react-router-dom";


/*
 * Wall
 *
 * Wall-komponenten representerar användarens personliga sida
 * ("min sida") i applikationen.
 *
 * På denna sida kan användaren:
 * - se sin profilinformation (namn och presentation)
 * - se sina egna inlägg
 * - skapa nya inlägg som kopplas till den inloggade användaren
 *
 * Komponenten är skyddad av ProtectedRoute och förutsätter
 * därför att användaren är inloggad.
 *
 * Funktionalitet:
 * - Hämtar autentiseringsdata (token och userId) via useAuth()
 * - Hämtar användarinformation och tillhörande inlägg från backend
 * - Skickar med JWT-token i Authorization-headern
 * - Skapar nya inlägg via POST /users/{userId}/posts
 * - Hämtar om listan med inlägg efter lyckat POST-anrop
 * - Hanterar laddningsstatus och tomma resultat
 *
 * Flöde:
 * 1. När komponenten renderas körs useEffect
 * 2. Ett GET-anrop görs till /users/{userId}/with-posts
 * 3. Backend svarar med både användarobjekt och en lista med inlägg
 * 4. Användardata och inlägg lagras i state
 * 5. Användaren kan skriva ett nytt inlägg i textfältet
 * 6. Klick på "Publicera" skickar ett POST-anrop med inläggets text
 * 7. Vid lyckat POST-anrop hämtas inläggen på nytt så att det nya
 *    inlägget visas direkt i listan
 *
 * Komponenten innehåller ingen routing- eller autentiseringslogik.
 * All sådan logik hanteras via routing (ProtectedRoute) och AuthProvider.
 */


const Wall = () => {
    const {token, userId} = useAuth();
    const [posts, setPosts] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPostText, setNewPostText] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const {userId: wallUserId} = useParams();

    const fetchPosts = async (pageToLoad = 0) => {
        if (!token || !wallUserId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/users/${wallUserId}/with-posts?page=${pageToLoad}&size=5`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch posts");
            }

            const data = await res.json();
            console.log("Hämtade inlägg och användardata:", data.posts.content[0]);
            setPosts(data.posts.content);
            setHasMore(!data.posts.last);
            setUser(data.user);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !wallUserId) return;
        setPage(0);
    }, [token, wallUserId]);

    useEffect(() => {
        if (!token || !wallUserId) return;
        fetchPosts(page);
    }, [page, token, wallUserId]);


    const handleCreatePost = async () => {
        if (!newPostText.trim()) {
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}/users/${wallUserId}/posts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        text: newPostText,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to create post");
            }

            setNewPostText("");
            await fetchPosts(); // hämta om listan efter lyckat POST
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditPost = (postId, currentText) => {
        console.log("Redigera inlägg:", postId);
        setEditingPostId(postId);
        setEditingText(currentText);
        setIsEditing(true);

    };

    const saveEdit = async () => {
        if (!token) return;

        try {
            const res = await fetch(API_BASE_URL + `/posts/${editingPostId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({text: editingText}),
            });

            if (!res.ok) {
                console.log("Inlägget redigerades inte korrekt");
                throw new Error("Failed to edit post");
            }

            const updatedPost = await res.json();
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === editingPostId ? updatedPost : post)
            );
            setIsEditing(false);
            setEditingPostId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeletePost = (postId) => {
        const confirmed = window.confirm("Är du säker på att du vill ta bort inlägget?")
        if (!confirmed) return;
        if (!token) return;
        console.log("Ta bort inlägg:", postId);
        deletePost(postId);
    };

    const deletePost = async (postId) => {
        if (!token) return;

        try {
            const res = await fetch(API_BASE_URL + `/posts/${postId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (!res.ok) {
                console.log("Inlägget togs inte bort korrekt");
                throw new Error("Failed to delete post");
            }

            // Uppdatera listan med inlägg efter borttagning
            setPosts((prevPosts) =>
                prevPosts.filter((post) => post.id !== postId));
        } catch (error) {
            console.error(error);
        }
    }

    if (loading || !user) {
        return <p>Laddar inlägg...</p>;


    }

    return (
        <div className="feed-container">
            <h1 className="center">{user.displayName}</h1>

            <div className="about-me">
                <p>
                    <b>Om mig:</b> {user.bio}
                </p>
            </div>

            {/* Skapa nytt inlägg */}
            <div className="create-post">
                <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Skriv ett nytt inlägg..."
                />
                <button onClick={handleCreatePost}>
                    Publicera
                </button>
            </div>

            {posts.length === 0 && <p>Inga inlägg hittades</p>}

            <ul className="post-list">
                {posts.map((post) => (
                    <li key={post.id} className="post-card">
                        <p className="post-text">{post.text}</p>
                        <hr/>
                        <small className="post-date">
                            {new Date(post.createdAt).toLocaleString()}
                        </small>

                        {post.userId === userId && (
                            <div className="post-actions">
                                <button onClick={() => handleEditPost(post.id, post.text)}>Redigera</button>
                                <button onClick={() => handleDeletePost(post.id)}>Ta bort</button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            {/* 🟦 Ladda fler-knappen */}
            {hasMore && (
                <button
                    onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        fetchPosts(nextPage);
                    }}
                >
                    Ladda fler
                </button>
            )}

            {/*Tagit hjälp av AI för att få fram en "föregående" knapp*/}
            {page > 0 && (
                <button
                    onClick={() => {
                        const previousPage = page - 1;
                        setPage(previousPage);
                        setPosts([]); // rensa listan
                        fetchPosts(previousPage);
                    }}
                >
                    Föregående
                </button>
            )}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Redigera inlägg</h3>

                        <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button onClick={saveEdit}>Spara</button>
                            <button onClick={() => setIsEditing(false)}>Avbryt</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wall;
