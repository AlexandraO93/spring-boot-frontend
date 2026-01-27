export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// FRIENDSHIPS
export async function getFriendships(userId, token) {
    const res = await fetch(`${API_BASE_URL}/friendships/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
}

export async function sendFriendRequest(requesterId, receiverId, token) {
    const res = await fetch(`${API_BASE_URL}/friendships`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({requesterId, receiverId})
    });
    return res.json();
}

export async function acceptFriendRequest(friendshipId, userId, token) {
    const res = await fetch(`${API_BASE_URL}/friendships/${friendshipId}/accept?userId=${userId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
}

export async function rejectFriendRequest(friendshipId, userId, token) {
    const res = await fetch(`${API_BASE_URL}/friendships/${friendshipId}/reject?userId=${userId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
}