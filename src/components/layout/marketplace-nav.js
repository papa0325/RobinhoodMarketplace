import { Link } from "react-router-dom";

const InnerNav = ({ active }) => {
    return (
        <div className="container">
            <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                <li className="nav-item">
                    <Link className={`nav-link ${ active == "personal" && "active"}`} to="/personal-collection">My Collection</Link>
                </li>
                <li className="nav-item">
                    <Link className={`nav-link ${ active == "mint" && "active"}`} to="/mint">Create Page</Link>
                </li>
                <li className="nav-item">
                    <Link className={`nav-link ${ active == "marketplace" && "active"}`} to="/marketplace">Search Here</Link>
                </li>
            </ul>
        </div>
    )
}

export default InnerNav;