import {useEffect, useState} from "react";
import {API_BASE_URL} from "../config/api.js";

/**
 * Hook för att hämta profilbild.
 * @param {string} username - användarens id eller namn
 * @param {string} token - JWT-token
 * @returns {string} - URL till profilbild, fallback till /default-avatar.png
 */
export const useProfileImage = (username, token, refreshKey) => {
    const [imageUrl, setImageUrl] = useState("/default-avatar.png");

    useEffect(() => {
        if (!username || !token) return;

        let isMounted = true;
        let objectUrl = null;

        const fetchImage = async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/users/${username}/profile-image`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) throw new Error("Could not fetch image");

                const blob = await res.blob();
                objectUrl = URL.createObjectURL(blob);

                if (isMounted) setImageUrl(objectUrl);
            } catch (err) {
                console.warn("Profile image fetch failed:", err);
                if (isMounted) setImageUrl("/default-avatar.png");
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl); // 🧠 viktigt!
        };
    }, [username, token, refreshKey]);

    return imageUrl;
};