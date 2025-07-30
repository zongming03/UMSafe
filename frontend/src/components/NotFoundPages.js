import React from "react";
import "../styles/NotFoundPages.css";
import { useNavigate } from "react-router-dom";

const NotFoundPages = () => {

    const navigate = useNavigate();

    const handleOnRedirectButtonClick = ()=>{
        navigate("/authentication/login",{replace:true})
    }

  return (
    <div className="notFoundPagesContainer">
      <h1>404 Pages Not Found</h1>
      <p>Please click the button below to redirect to our login page</p>
      <button onClick={handleOnRedirectButtonClick}>Redirect</button>
    </div>
  );
};

export default NotFoundPages;
