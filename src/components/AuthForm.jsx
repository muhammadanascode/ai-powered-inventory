import React from 'react';
// import '../styles/auth.css';

const AuthForm = ({title,submitLabel,children,onSubmit}) => {
  return (
    <>
    <div className="auth-container">
        <h2 className="auth-title">{title}</h2>
        {children}
        <button type="submit" onClick={onSubmit}>{submitLabel}</button>
    </div>
    </>
  );
};

export default AuthForm;
