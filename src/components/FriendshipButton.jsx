import {useEffect, useState} from "react";
import {acceptFriendRequest, API_BASE_URL, rejectFriendRequest, sendFriendRequest} from "../config/api";
import {useAuth} from "../context/useAuth";
import "./FriendshipButton.css";

export default function FriendshipButton({profileUserId}) {
    const {user, token} = useAuth();
    const [status, setStatus] = useState("LOADING")
    const [friendshipId, setFriendshipId] = useState(null);
    const [requesterId, setRequesterId] = useState(null);
    const [receiverId, setReceiverId] = useState(null);

    const currentUserId = user?.id;

    useEffect(() => {
        setStatus("LOADING");
        setFriendshipId(null);
        setRequesterId(null);
        setReceiverId(null);
    }, [user, profileUserId]);

    useEffect(() => {
        if (!user || !profileUserId) return;

        const fetchStatus = async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/friendships/status?userId=${profileUserId}`,
                    {
                        credentials: "include",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();
                setStatus(data.status);
                setFriendshipId(data.friendshipId || null);
                setRequesterId(data.requesterId || null);
                setReceiverId(data.receiverId || null);
            } catch {
                setStatus("NONE");
            }
        };
        fetchStatus();
    }, [profileUserId, user, token]);

    if (!user) return null;

    const handleSend = async () => {
        const newRelation = await sendFriendRequest(currentUserId, profileUserId, token);
        setStatus("PENDING");
        setFriendshipId(newRelation.id);
        setRequesterId(currentUserId);
        setReceiverId(profileUserId);
    }

    const handleAccept = async () => {
        await acceptFriendRequest(friendshipId, currentUserId, token);
        setStatus("ACCEPTED");
    }

    const handleReject = async () => {
        await rejectFriendRequest(friendshipId, currentUserId, token)
        setStatus("REJECTED");
    }

    // UI-logik
    if (status === "LOADING") {
        return <button className="friendship-btn small">...</button>
    }

    // Add friend
    if (status === "NONE") {
        return (
            <button
                className="friendship-btn friendship-add small"
                onClick={handleSend}>
                Lägg till vän
            </button>
        );
    }

// Friends ✓
    if (status === "ACCEPTED") {
        return <span className="friendship-label small">Vänner ✓</span>;
    }

// Pending
    if (status === "PENDING") {
        if (receiverId === currentUserId) {
            return (
                <>
                    <button className="friendship-btn friendship-accept small"
                            onClick={handleAccept}>
                        Acceptera
                    </button>

                    <button
                        className="friendship-btn friendship-reject small"
                        onClick={handleReject}>
                        Avböj
                    </button>
                </>
            );
        }

        return (
            <button className="friendship-btn friendship-pending" disabled>
                Request sent
            </button>
        );
    }

// Rejected → allow sending again
    if (status === "REJECTED") {
        return (
            <button className="friendship-btn friendship-add small"
                    onClick={handleSend}>
                Lägg till vän
            </button>
        );
    }
    return null;
}