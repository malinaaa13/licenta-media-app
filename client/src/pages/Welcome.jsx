import { Link } from "react-router-dom";

function Welcome() {
    return (
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100 ">
            <h1 className="display3 fw-bold mb-4">Welcome to Muser</h1>
            <p className="lead mb-5">Discover your next favorite media. Join us today!</p>

            <div className="d-flex gap-3">
                <Link to="/login" className="btn btn-info btn-lg px-5 fw-bold">
                Log In
                </Link>
                <Link to="/register" className="btn btn-info btn-lg px-5 fw-bold">
                Register
                </Link>
            </div>
        </div>
    );
}

export default Welcome;