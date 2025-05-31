import AuthForm from '@/components/AuthForm';
import InputField from '@/components/InputField';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const Login = () => {

    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')

    useEffect(() => {
        async function checkToken() {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('/api/account/verifyToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            });

            const data = await response.json();

            if (data.valid) {
                router.push('/');
            } else {
                localStorage.removeItem('authToken');
            }
        }

        checkToken();
    }, []);


    const handleSubmit = async () => {
        console.log("Loginn")
        try {
            const response = await fetch(`/api/account/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })

            // Check if the response is not OK (status code 200-299)
            if (!response.status === 200) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to login');
            }

            const data = await response.json();
            console.log('Login successful:', data);

            // Save the token to local storage 
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                console.log('Token saved to local storage');
            } else {
                throw new Error('Token not received');
            }

            // Clear the input fields after successful login
            setEmail('');
            setPassword('');

            // Redirecting to home page after successful login
            router.push('/');


        } catch (error) {
            console.log("Error occured : ", error)
        }
    }

    return (
        <>
            <AuthForm
                title={"Access Your Intelligent Inventory"}
                submitLabel={"login"}
                onSubmit={handleSubmit}
                subtitle={"Track, manage, and optimize every aspect of your inventory with intelligent precision and real-time AI insights"}
            >
                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder={"eg:john1234@gmail.com"}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    placeholder={"Mnimum 8 letters (eg :12345678)"}
                    onChange={(e) => setPassword(e.target.value)}
                />

            </AuthForm>
        </>
    );
};

export default Login;