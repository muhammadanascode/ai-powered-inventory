import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {

  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function checkToken() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
      }

      const response = await fetch('/api/account/verifyToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      });

      const data = await response.json();

      if (!data.valid) {
        router.push('/login');
      } else {
        setIsVerifying(false);
      }
    }

    checkToken();
  }, []);

  if (isVerifying) {
    return <div>Verifying...</div>;
  }


  return (
    <>
      <div>Hello World</div>
    </>
  );
}
