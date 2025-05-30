import React from 'react';
import '../styles/auth.css';

const AuthForm = ({ title, submitLabel, children, onSubmit, subtitle }) => {
    return (
        <>
            <div className="auth-container">
                <h2 className="auth-title">{title}</h2>
                <h3 className="auth-subtitle">{subtitle}</h3>
                {children}
                {submitLabel.toLowerCase() === 'signup' && (
                    <p className="auth-link">
                        Already have an account? <a href="/login" className='link'>Login</a>
                    </p>
                )}
                {submitLabel.toLowerCase() === 'login' && (
                    <p className="auth-link">
                        Don't have an account? <a href="/signup" className='link'>Signup</a>
                    </p>
                )}
                <button className='btn' type="submit" onClick={onSubmit}>{submitLabel}</button>
            </div>
        </>
    );
};

export default AuthForm;
