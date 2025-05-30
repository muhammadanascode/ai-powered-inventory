import React from 'react';
import '../styles/inputField.css'

const InputField = ({ label, name, type, value, onChange, placeholder }) => (
  <div className="input-field-div">
    <label htmlFor={name}>{label}</label>
    <input
    className='input-field'
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
    />
  </div>
);

export default InputField;
