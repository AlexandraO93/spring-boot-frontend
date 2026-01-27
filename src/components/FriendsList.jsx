import {useEffect, useState} from "react";
import {API_BASE_URL} from "../config/api";
import {useAuth} from "../context/useAuth";
import "./FriendsList.css"

export default function FriendsList({userId}) {
    const {token} = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/friendships/users/${userId}/friends`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();
                setFriends(data);
            } catch (err) {
                console.error("Kunde inte hämta vänner", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [userId, token]);

    if (loading) return <p>Laddar vänner...</p>;

    if (friends.length === 0) {
        return <p>Inga vänner ännu.</p>;
    }

    return (
        <div className="friends-box">
            <h3 className="friends-title">Vänner</h3>
            <ul className="friends-list">
                {friends.map(friend => (
                    <li key={friend.id} className="friend-item">
                        <span className="friend-name">{friend.username}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}