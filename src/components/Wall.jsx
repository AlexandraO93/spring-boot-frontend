import {useEffect, useState} from "react";
import {useAuth} from "../context/useAuth";
import "./Feed.css";
import "./Wall.css";
import {API_BASE_URL} from "../config/api.js";


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

    const fetchPosts = async (pageToLoad = 0) => {
        if (!token || !userId) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}/users/${userId}/with-posts?page=${pageToLoad}&size=5`,
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
        setPosts([]);
        setPage(0);
        fetchPosts(0);
    }, [token, userId]);

    const handleCreatePost = async () => {
        if (!newPostText.trim()) {
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}/users/${userId}/posts`,
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
                {posts.content.map((post) => (
                    <li key={post.id} className="post-card">
                        <p className="post-text">{post.text}</p>
                        <hr/>
                        <small className="post-date">
                            {new Date(post.createdAt).toLocaleString()} av {user.displayName}
                        </small>
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
        </div>
    );
};

export default Wall;
