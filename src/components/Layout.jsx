import {Outlet, useNavigate} from "react-router-dom";
import {useAuth} from "../context/useAuth";
import "./Layout.css";
import NavBar from "./NavBar";

/*
 * Layout
 *
 * Layout-komponenten definierar den gemensamma strukturen
 * för applikationens sidor.
 *
 * Den innehåller:
 * - ett header-område (titel + globala kontroller)
 * - ett main-område där sidinnehåll renderas
 * - ett footer-område som alltid visas
 *
 * Headern visar även en logout-knapp när användaren
 * är inloggad.
 *
 * <Outlet /> används av React Router för att rendera
 * den aktuella routens komponent inuti layouten.
 *
 * Layout-komponenten innehåller ingen affärslogik
 * kopplad till data eller backend, men ansvarar för
 * global användarinteraktion såsom utloggning.
 */

const Layout = () => {
    const {token, logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", {replace: true});
    };

    return (
        <>
            {/* Visa NavBar endast när användaren är inloggad */}
            {token && <NavBar/>}

            <header className="app-header">
                <h1>Jensen social app</h1>

                {token && (
                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logga ut
                    </button>
                )}
            </header>

            <main className="app-main">
                <Outlet/>
            </main>

            <footer className="app-footer">
                <p>© TheGreat8 2026</p>
            </footer>
        </>
    );
};

export default Layout;
