import AdminPanel from "@/components/AdminPanel";
import styles from "@/styles/Home.module.css";
import getToken from "@/utils/getToken";
import { useEffect, useState } from "react";


export default function Home() {

  const [dates, setDates] = useState([]);
  const [data, setData] = useState(null);

  const getDate = async () => {
    // Fetch date data from the API
    try {

      const token = getToken();

      const response = await fetch('/api/adminPage/date', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
      });
      const data = await response.json();
      if (response.status !== 200) {
        console.log(data.error);
      }

      console.log(data);
      setDates(data);

      // Fetch sales data for the last date in the list
      if (data.length > 0) {
        const lastDate = data[1];
        console.log(lastDate);

        // Calling function to get the sales
        getSales(lastDate.month, lastDate.year);

      }

    } catch (error) {
      console.error("Error fetching date data:", error);
    }
  };

  const getSales = async (month, year) => {
    // Fetch sales data from the API
    try {
      const token = getToken();

      const response = await fetch('/api/adminPage/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({ month, year })
      });

      const data = await response.json();
      if (response.status !== 200) {
        console.log(data.error);
      }

      console.log(data);
      setData(data);

    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  useEffect(() => {
    getDate();
  }, [])

  return (
    <>
      <AdminPanel dates={dates} data={data} />
    </>
  );
}
