import React, { useEffect, useState } from "react";
import "../styles/AdminPanel.css";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    LineChart,
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";


const AdminPanel = ({ dates, data, salesData, updateDate }) => {

    const [selectedValue, setSelectedValue] = useState('');

    useEffect(() => {
        // If dates are provided, set the last month as defaults selected value
        if (dates && dates.length > 0) {
            // Set the initial selected value to the last date in the list
            const lastDate = dates[dates.length - 1];
            setSelectedValue(`${lastDate.month}-${lastDate.year}`);
        }
    }, [dates])

    // Function to get the change arrow based on direction
    const getChangeArrow = (direction) => {
        if (direction == 'up') return '▲';
        if (direction == 'down') return '▼';
        return '';
    };

    // Calculate dynamic max for Y-axis
    const getYAxis = () => {
        if (!salesData || salesData.length === 0) return 1000; // Default max value if no data
        const maxSales = Math.max(...salesData.map(sale => sale.total_sales));
        return Math.ceil(maxSales / 1000) * 1000; // Round up to nearest 1000
    }

    // Handle change in date selection
    const handleChange = (value) => {
        const [month, year] = value.split('-').map(Number);
        updateDate(month, year);
    }


    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-head">Inventory Panel</h1>
                    <div className="admin-line"></div>
                </div>

                {/* Date selection dropdowns */}
                <div className="admin-select">
                    <div className="admin-select">
                        <label htmlFor="month-select">Date: </label>
                        <select id="month-select"
                            className="admin-select"
                            value={selectedValue}
                            onChange={(e) => {
                                setSelectedValue(e.target.value);
                                handleChange(e.target.value)
                            }
                            }>

                            {/* dynamically generated */}
                            {dates.map((d, index) => (
                                <option key={index} value={`${d.month}-${d.year}`}>
                                    {new Date(d.year, d.month - 1).toLocaleString("default", {
                                        month: "long",
                                    })}{" "}
                                    {d.year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="admin-cards">

                {/* Card showing total sales */}
                <div className="admin-card-block">
                    <div className="admin-card admin-card-1">
                        <h2>Total Sales</h2>

                        <div style={{ width: 40, height: 40, margin: '0 auto' }}>
                            <CircularProgressbar
                                value={`${data?.change_percent_sales || 0}%`}
                                text={`${data?.change_percent_sales || 0}%`}
                                styles={buildStyles({
                                    textColor: "#000",
                                    pathColor: "#007bff",
                                    trailColor: "#e0e0e0",
                                })}
                            />
                        </div>
                        <h4>{data?.total_sales || "-"}</h4>
                        <p className="comparison positive">{getChangeArrow(data?.change_direction_sales)} {data?.change_direction_sales} {data?.change_percent_sales}% from last month</p>
                    </div>

                    {/* Card showing total number of orders */}
                    <div className="admin-card admin-card-2">
                        <h2>Total Orders</h2>

                        <div style={{ width: 40, height: 40, margin: '0 auto' }}>
                            <CircularProgressbar
                                value={`${data?.change_percent_orders || 0}%`}
                                text={`${data?.change_percent_orders || 0}%`}
                                styles={buildStyles({
                                    textColor: "#000",
                                    pathColor: "#007bff",
                                    trailColor: "#e0e0e0",
                                })}
                            />
                        </div>
                        <h4>{data?.total_orders || "-"}</h4>
                        <p className="comparison positive"> {getChangeArrow(data?.change_direction_orders)} {data?.change_direction_orders} {data?.change_percent_orders}% from last month</p>
                    </div>

                    {/* Bar chart showing monthly sales */}
                    <div className="admin-card admin-sales-bar-chart">
                        <h2>Monthly Sales (Bar Chart)</h2>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis domain={[0, getYAxis()]} />
                                <Tooltip />
                                <Bar dataKey="total_sales" fill="#2d93ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line chart showing sales trend over months */}
                <div className="admin-card admin-sales-chart">
                    <h2>Sales Overview</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, getYAxis()]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="total_sales" stroke="#2d93ff" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;