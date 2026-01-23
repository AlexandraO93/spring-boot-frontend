import {useEffect, useState} from "react";
import {useAuth} from "../context/useAuth";
import "./LoginForm.css";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "../config/api.js";

const AuthForm = () => {
    const {login, token} = useAuth();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (token) {
            navigate("/feed");
        }
    }, [token, navigate]);

    const handleSubmit = async () => {
        if (isRegister) {
            const res = await fetch(`${API_BASE_URL}/users/register`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, email, password}),
            });
            const data = await res.json();
            if (!data.token || res.json()) {
                throw new Error("Registrering misslyckades");
            }

            alert("Konto skapat! Logga in.");
            setIsRegister(false);
            return;
        }
        try {
            await login(username, password);
        } catch {
            alert("Inloggning misslyckades! Fel användarnamn eller lösenord");
        }
    };

    return (
        <div className="login-form">
            <h2>{isRegister ? "Skapa konto" : "Logga in"}</h2>

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
            />

            {isRegister && (
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            )}

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <button onClick={handleSubmit}>
                {isRegister ? "Registrera" : "Logga in"}
            </button>

            <p style={{marginTop: "1rem"}}>
                {isRegister ? (
                    <>
                        Har du redan konto?{" "}
                        <span
                            style={{color: "#646cff", cursor: "pointer", textDecoration: "underline"}}
                            onClick={() => setIsRegister(false)}
                        >
                Logga in
            </span>
                    </>
                ) : (
                    <>
                        Har du inget konto?{" "}
                        <span
                            style={{color: "#646cff", cursor: "pointer", textDecoration: "underline"}}
                            onClick={() => setIsRegister(true)}
                        >
                Registrera dig
            </span>
                    </>
                )}
            </p>
        </div>
    );
};

export default AuthForm;
