import React from "react";
import "../styles/NotFoundPages.css";
import { useNavigate } from "react-router-dom";

const NotFoundPages = () => {

    const navigate = useNavigate();

    // Check if user is logged in
    const isLoggedIn = () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const user = localStorage.getItem("user") || sessionStorage.getItem("user");
      return !!(token && user);
    };

    const handleOnRedirectButtonClick = ()=>{
        if (isLoggedIn()) {
          navigate("/dashboard", {replace: true});
        } else {
          navigate("/login", {replace: true});
        }
    }

    const redirectText = isLoggedIn() 
      ? "Please click the button below to redirect to our dashboard page"
      : "Please click the button below to redirect to our login page";

  return (
    <div className="notFoundPagesContainer">
      <h1>404 Pages Not Found</h1>
      <p>{redirectText}</p>
      <button onClick={handleOnRedirectButtonClick}>Redirect</button>
    </div>
  );
};

export default NotFoundPages;
