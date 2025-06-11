import React from "react";
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

const salesData = [
    { name: "Jan", sales: 4000 },
    { name: "Feb", sales: 3000 },
    { name: "Mar", sales: 5000 },
    { name: "Apr", sales: 7000 },
    { name: "May", sales: 6000 },
];

const percentage = 75;

const AdminPanel = () => {
    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-head">Inventory Panel</h1>
                    <div className="admin-line"></div>
                </div>

                {/* Date selection option */}
                <div className="admin-select">
                    <label htmlFor="month-select">Month: </label>
                    <select id="month-select" className="admin-select">
                        <option value="Jan">January</option>
                        <option value="Feb">February</option>
                        <option value="Mar">March</option>
                        <option value="Apr">April</option>
                        <option value="May">May</option>
                        {/* Add more months as needed */}
                    </select>
                    <label htmlFor="year-select">Year: </label>
                    <select id="year-select" className="admin-select">
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        {/* Add more years as needed */}
                    </select>
                </div>
            </div>

            <div className="admin-cards">
                <div className="admin-card-block">
                    <div className="admin-card admin-card-1">
                        <h2>Total Sales</h2>

                        <div style={{ width: 40, height: 40, margin: '0 auto' }}>
                            <CircularProgressbar
                                value={percentage}
                                text={`${percentage}%`}
                                styles={buildStyles({
                                    textColor: "#000",
                                    pathColor: "#007bff",
                                    trailColor: "#e0e0e0",
                                })}
                            />
                        </div>


                        <h4>Rs. 1,00,000</h4>
                        <p className="comparison positive">▲ Up 15% from last month</p>
                    </div>

                    <div className="admin-card admin-card-2">
                        <h2>Total Orders</h2>

                        <div style={{ width: 40, height: 40, margin: '0 auto' }}>
                            <CircularProgressbar
                                value={percentage}
                                text={`${percentage}%`}
                                styles={buildStyles({
                                    textColor: "#000",
                                    pathColor: "#007bff",
                                    trailColor: "#e0e0e0",
                                })}
                            />
                        </div>

                        <h4>54678</h4>
                        <p className="comparison positive">▲ Up 15% from last month</p>
                    </div>
                    <div className="admin-card admin-sales-bar-chart">
                        <h2>Monthly Sales (Bar Chart)</h2>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="sales" fill="#2d93ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="admin-card admin-sales-chart">
                    <h2>Sales Overview</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="#2d93ff" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
