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

    console.log("API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
    console.log("TOKEN:", token);

    const fetchPosts = async (pageToLoad = 0) => {
        if (!token) return;

        try {
            const res = await fetch(API_BASE_URL + `/posts?page=${pageToLoad}&size=5`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch posts");
            }

            const data = await res.json();
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

    if (loading) {
        return <p>Laddar inlägg...</p>;
    }

    return (
        <div className="feed-container">
            <Link to="/wall">Till min sida</Link>
            <h1>Inlägg</h1>

            {posts.length === 0 && <p>Inga inlägg hittades</p>}

            <ul className="post-list">
                {posts.map((post) => (
                    <li key={post.id} className="post-card">
                        <p className="post-text">{post.text}</p>
                        <hr/>
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
