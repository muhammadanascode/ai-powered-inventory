import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SideBar from './SideBar';
import NavBar from './NavBar';
import '../styles/Layout.css'; // Assuming you have a CSS file for styles

const Layout = ({ children }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hideLayout = ['/login', '/signup'].includes(router.pathname);

  useEffect(() => {
    async function verifyAuth() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token && !hideLayout) {
          router.push('/login');
          return;
        }

        // Skip verification for public pages
        if (hideLayout) {
          setIsLoading(false);
          return;
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
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [router.pathname]);

  if (isLoading) {
    return <div>Verifying...</div>;
  }

  return (
    <div className="layout-container">
      {!hideLayout && isAuthorized && <SideBar />}
      <div className={`main-content ${hideLayout ? 'full-width' : ''}`}>
        {!hideLayout && isAuthorized && <NavBar />}
        <div className="page-content">
          {!hideLayout && !isAuthorized ? null : children}
        </div>
      </div>
    </div>
  );
};

export default Layout;