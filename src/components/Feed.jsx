import {useEffect, useState} from "react";
import {useAuth} from "../context/useAuth";

import {Link} from "react-router-dom";
import "./Feed.css";
import {API_BASE_URL} from "../config/api.js";

/*
 * Feed
 *
 * Denna komponent representerar användarens flöde (feed) med inlägg.
 * Komponenten är tänkt att användas bakom en ProtectedRoute och
 * förutsätter därför att användaren är inloggad.
 *
 * Funktionalitet:
 * - Hämtar autentiseringsdata (token och userId) via useAuth()
 * - Hämtar inlägg från backend med hjälp av fetch
 * - Skickar med JWT-token i Authorization-headern
 * - Hanterar laddningsstatus och tomma resultat
 *
 * Flöde:
 * 1. När komponenten renderas körs useEffect
 * 2. Om token eller userId saknas avbryts hämtningen
 * 3. Om användaren är inloggad görs ett anrop till /posts
 * 4. Vid lyckat svar lagras inläggen i state
 * 5. Komponenten renderar:
 *    - laddningstext under hämtning
 *    - ett meddelande om inga inlägg finns
 *    - annars en lista med inlägg
 */

const Feed = () => {
    const {token, userId} = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [friendRequests, setFriendRequests] = useState([]);

    const fetchPosts = async (pageToLoad = 0) => {
        if (!token) return;

        try {
            const res = await fetch(API_BASE_URL + `/posts?page=${pageToLoad}&size=5`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                console.log("Posts hämtades inte korrekt");
                throw new Error("Failed to fetch posts");
            }

            const data = await res.json();
            console.log(data);
            setPosts(data.content);
            setHasMore(!data.last)
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

    useEffect(() => {
        if (!userId) return; // bara på min egen wall

        const fetchRequests = async () => {
            const res = await fetch(`${API_BASE_URL}/friendships/users/${userId}/requests`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!res.ok) {
                console.error("Kunde inte hämta vänförfrågningar");
                return;
            }
            const data = await res.json();
            setFriendRequests(data);
        };
        fetchRequests();
    }, [userId, token]);

    if (loading) {
        return <p>Laddar inlägg...</p>;
    }


    const accept = async (requestId) => {
        await fetch(`${API_BASE_URL}/friendships/${requestId}/accept?userId=${userId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const decline = async (requestId) => {
        await fetch(`${API_BASE_URL}/friendships/${requestId}/reject?userId=${userId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    };

    return (
        <div className="feed-container">
            <div className="feed-header-row">
                <h1>Inlägg</h1>

                <div className="friend-requests-box-feed">
                    <h3>Vänförfrågningar</h3>

                    {friendRequests.length === 0 ? (
                        <p>Inga vänförfrågningar just nu.</p>
                    ) : (
                        friendRequests.map(req => (
                            <div key={req.id} className="friend-request-item-feed">
                                <span>{req.requester.username}</span>
                                <button onClick={() => accept(req.id)}>Acceptera</button>
                                <button onClick={() => decline(req.id)}>Avvisa</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <h1 className="link">
                <Link to={`/wall/${userId}`}>Till min sida</Link>
            </h1>

            {posts.length === 0 && <p>Inga inlägg hittades</p>}

            <ul className="post-list">
                {posts.map((post) => (

                    <li key={post.id} className="post-card">
                        <p className="post-text">{post.text}</p>
                        <small className="post-author">
                            av{" "}
                            <Link to={`/wall/${post.userId}`}>
                                {post.username || post.user?.username || "Okänd"}
                            </Link>
                        </small>

                        <span className="dot">·</span>

                        <small className="post-date">
                            {new Date(post.createdAt).toLocaleString()}
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

export default Feed;
