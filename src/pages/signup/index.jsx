import React, { useState } from 'react';
import AuthForm from '@/components/AuthForm';
import InputField from '@/components/InputField';
import { useRouter } from 'next/router';

const Signup = () => {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        console.log("Form Submitted:", name, email, password);

        //Calling post request to create account
        try{
            const response = await fetch('/api/account/createaccount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            // Check if the response is not OK (status code 200-299)
            if (!response.status==201) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create account');
            }

            const data = await response.json();
            console.log('Account created successfully:', data);

            //resetting vlaues after successful account creation
            setName('');
            setEmail('');
            setPassword('');

            //Redirecting to login page after successful account creation
            const router = useRouter();
            router.push('/login');

        }catch(error) {
          console.error('Error creating account:', error);
        }  
    };

    return (
        <div>
            <AuthForm title="Create Your Personal Inventory" submitLabel="Signup" onSubmit={handleSubmit}>
                <InputField
                    label="Name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </AuthForm>
        </div>
    );
};

export default Signup;
