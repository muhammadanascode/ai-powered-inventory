export default function getToken() {
    const token = ( localStorage.getItem('authToken'));
    return token || null;
}