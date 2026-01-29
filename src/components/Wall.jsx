import {useEffect, useState} from "react";
import {useAuth} from "../context/useAuth";
import "./Feed.css";
import "./Wall.css";
import {API_BASE_URL} from "../config/api.js";
import {useParams} from "react-router-dom";
import FriendshipButton from "./FriendshipButton.jsx";
import FriendsList from "./FriendsList.jsx";
import {useProfileImage} from "./useProfileImage.jsx";

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
    const {token, userId, user, setUser} = useAuth(); //Inloggad användare
    const {userId: wallUserId} = useParams(); //Användaren vars sida visas
    const [posts, setPosts] = useState([]);
    const [wallUser, setWallUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPostText, setNewPostText] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const profileImageUrl = useProfileImage(wallUserId, token);


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
            setPosts(data.posts.content);
            setWallUser(data.user);
            setHasMore(!data.posts.last);
            console.log("Fetched wallUser:", data.user);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isMyWall = Number(userId) === Number(wallUserId);

    useEffect(() => {
        if (!token || !wallUserId) return;
        setPage(0);
    }, [token, wallUserId]);

    useEffect(() => {
        if (!token || !wallUserId) return;
        fetchPosts(page);
    }, [page, token, wallUserId]);

    useEffect(() => {
        return () => {
            if (wallUser?.newProfileImage) {
                URL.revokeObjectURL(wallUser.newProfileImage);
            }
        };
    }, [wallUser?.newProfileImage]);

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
    if (loading || !wallUser) {
        return <p>Laddar inlägg...</p>;
    }

    const saveProfile = async () => {
        if (!token) return;

        try {
            // 1️⃣ Kontrollera att displayName och bio inte är tomma
            if (!wallUser.displayName?.trim() || !wallUser.bio?.trim()) {
                alert("Display name och bio får inte vara tomma.");
                return;
            }

            // 2️⃣ Skicka uppdaterad profilinfo
            const profileData = {
                displayName: wallUser.displayName.trim(),
                bio: wallUser.bio.trim(),
            };

            const res = await fetch(`${API_BASE_URL}/users/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });

            if (!res.ok) {
                throw new Error("Kunde inte uppdatera profilinfo");
            }

            // 3️⃣ Om användaren valt ny profilbild, ladda upp den
            if (wallUser.newProfileImage) {
                const formData = new FormData();
                formData.append("file", wallUser.newProfileImage);

                const imgRes = await fetch(`${API_BASE_URL}/users/me/profile-image`, {
                    method: "POST",
                    headers: {Authorization: `Bearer ${token}`},
                    body: formData, // Content-Type sätts automatiskt
                });

                if (!imgRes.ok) throw new Error("Kunde inte ladda upp profilbild");

                // Rensa det temporära fältet så vi inte skapar memory leaks
                setWallUser(prev => ({...prev, newProfileImage: null}));
            }

            // 4️⃣ Hämta uppdaterad användare från backend
            const userRes = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {Authorization: `Bearer ${token}`},
            });

            if (!userRes.ok) throw new Error("Kunde inte hämta uppdaterad användare");

            const updatedUser = await userRes.json();
            setWallUser(updatedUser);

            // Om det är min wall, uppdatera context
            if (isMyWall) setUser(updatedUser);

            setIsEditingProfile(false);
        } catch (err) {
            console.error("Save profile error", err);
            alert(err.message);
        }
    };

    return (
        <div className="feed-container">

            <h1 className="profile-name">{wallUser.displayName}</h1>

            <div className="wall-layout">
                <div className="left-column">
                    <div className="about-me">
                        <p><b>Om mig:</b> {wallUser.bio}</p>

                        {isMyWall && (
                            <button
                                className="edit-profile-btn"
                                onClick={() => setIsEditingProfile(true)}
                            >
                                Redigera profil
                            </button>
                        )}
                    </div>
                    <FriendsList userId={wallUserId}/>
                </div>

                <div className="right-column">
                    {isMyWall && (
                        <div className="create-post-avatar">
                            <img
                                src={profileImageUrl}
                                alt="Profilbild"
                                className="profile-avatar"
                            />
                        </div>
                    )}

                    {/* 🔥 Vänskapsknappen */}
                    {!isMyWall && (
                        <div className="friendship-wrapper">
                            <FriendshipButton profileUserId={wallUserId}/>
                        </div>
                    )}

                    {/* Skapa nytt inlägg */}
                    {isMyWall && (
                        <div className="create-post small-create-post">
                <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Skriv ett nytt inlägg..."
                />
                            <button onClick={handleCreatePost}>Publicera</button>
                        </div>
                    )}
                    <ul className="post-list">
                        {posts.map((post) => (
                            <li key={post.id} className="post-card">
                                <p className="post-text">{post.text}</p>
                                <hr/>
                                <small className="post-date">
                                    {new Date(post.createdAt).toLocaleString()}
                                </small>

                                {isMyWall && Number(userId) === post.userId && (
                                    <div className="post-actions">
                                        <button onClick={() => handleEditPost(post.id, post.text)}>Redigera</button>
                                        <button onClick={() => handleDeletePost(post.id)}>Ta bort</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    {posts.length === 0 && <p>Inga inlägg hittades</p>}

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
            </div>

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

            {isEditingProfile && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Redigera profil</h3>

                        <input
                            type="text"
                            placeholder="Display name"
                            value={wallUser.displayName || ""}
                            onChange={(e) =>
                                setWallUser(prev => ({
                                    ...prev, displayName: e.target.value
                                }))
                            }
                        />

                        <textarea
                            placeholder="Bio"
                            value={wallUser.bio || ""}
                            onChange={(e) =>
                                setWallUser(prev => ({
                                    ...prev, bio: e.target.value
                                }))
                            }
                        />

                        {/* Filväljare */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setWallUser(prev => ({...prev, newProfileImage: e.target.files[0]}));
                                }
                            }}
                        />

                        {/* Förhandsvisning visas endast om en bild valts */}
                        {wallUser.newProfileImage && (
                            <img
                                src={URL.createObjectURL(wallUser.newProfileImage)}
                                alt="Förhandsvisning"
                                className="profile-avatar preview-image"
                            />
                        )}

                        <div className="modal-actions">
                            <button onClick={saveProfile}>Spara</button>
                            <button onClick={() => setIsEditingProfile(false)}>Avbryt</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wall;
