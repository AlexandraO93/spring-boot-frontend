import {Link} from "react-router-dom";
import "./NavBar.css";
import {useAuth} from "../context/useAuth";

const NavBar = () => {
    const {userId} = useAuth(); // hämtar inloggad användares id

    return (
        <nav className="navbar">
            <ul>
                <li>
                    <Link to="/feed">Feed</Link>
                </li>
                <li>
                    {/* Wall-länk går direkt till inloggad användares wall */}
                    <Link to={`/wall/${userId}`}>Wall</Link>
                </li>
            </ul>
        </nav>
    );
};

export default NavBar;