import {Link} from "react-router-dom";
import "./NavBar.css";

const NavBar = () => {
    return (
        <nav className="navbar">
            <ul>
                <li><Link to="/feed">Feed</Link></li>
                <li><Link to="/wall">Wall</Link></li>
            </ul>
        </nav>
    );
};

export default NavBar;