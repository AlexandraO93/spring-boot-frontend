import {useState} from "react";
import {AuthContext} from "./AuthContext";
import {API_BASE_URL} from "../config/api";

/*
 * AuthProvider
 *
 * Wrapper-komponent som omsluter hela applikationen.
 * Ansvarar för autentiseringslogik:
 * - håller state för token och userId
 * - lagrar token och userId i localStorage
 * - återställer auth-state vid siduppdatering
 * - tillhandahåller login- och logout-funktioner
 *   via AuthContext.Provider
 */

export const AuthProvider = ({children}) => {
    // Initiera state från localStorage så auth överlever refresh
    const [token, setToken] = useState(
        localStorage.getItem("token")
    );
    const [userId, setUserId] = useState(
        localStorage.getItem("userId")
    );

    const login = async (username, password) => {
        const res = await fetch(`${API_BASE_URL}/request-token`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password}),
        });

        if (!res.ok) {
            throw new Error("Login failed");
        }

        const data = await res.json();

        setToken(data.token);
        console.log("Inloggad, token:", data.token);
        setUserId(data.userId);
        console.log("Inloggad, userId:", data.userId);

        // Persistera auth-data
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
    };

    const logout = () => {
        setToken(null);
        setUserId(null);

        localStorage.removeItem("token");
        localStorage.removeItem("userId");
    };

    return (
        <AuthContext.Provider value={{token, userId, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};
