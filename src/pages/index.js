import AdminPanel from "@/components/AdminPanel";
import styles from "@/styles/Home.module.css";
import getToken from "@/utils/getToken";
import { useEffect, useState } from "react";


export default function Home() {

  const [dates, setDates] = useState([]);
  const [data, setData] = useState(null);
  const [briefSalesData, setBriefSalesData] = useState(null);

  const monthsNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

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
        const lastDate = data[data.length - 1];
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

  const getBriefSalesData = async () => {
    try {
      const token = getToken();
      if (!token) {
        return
      }
      // Fetch sales data for the last date in the list
      const res = await fetch('/api/adminPage/brief_sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        }
      })

      const data = await res.json();
      if (res.status !== 200) {
        console.log(data.error);

      }
      console.log(data);

      //Reformat the data to include month names
      const formattedData = data.map((sale) => {
        return {
          month: monthsNames[sale.month - 1],
          year: sale.year,
          total_sales: sale.total_sales,
          total_orders: sale.total_orders
        }
      })
      // Set the brief sales data state
      setBriefSalesData(formattedData);

    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  }

  useEffect(() => {
    // Fetch initial data when the component mounts
    getDate();
    // Fetch brief sales data
    getBriefSalesData();
  }, [])

  const handleUpdate = (month, year) => {
    // Update the sales data when a new date is selected
    getSales(month, year);
  }

  return (
    <>
      <AdminPanel dates={dates} data={data} salesData={briefSalesData} updateDate={handleUpdate} />
    </>
  );
}
