import React from 'react';

const InputField = ({ label, name, type, value, onChange }) => (
  <div className="auth-field">
    <label htmlFor={name}>{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required
    />
  </div>
);

export default InputField;
