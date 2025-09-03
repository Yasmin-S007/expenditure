import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Filter, TrendingUp, ShoppingBag, DollarSign, Package, AlertCircle, Users, RefreshCw } from 'lucide-react';
import { fetchAllOrders, getRecentOrders, processOrdersData } from '../api/woocommerce';

const WooCommerceAnalytics = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredData, setFilteredData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        dailyRevenue: [],
        dailyOrders: [],
        topProducts: [],
        salesProducts: [],
        a: {},
        topCustomers: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const applyFilter = async () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            setError('Start date cannot be after end date.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Fix date handling - include entire end day
            const dateAfter = new Date(start);
            dateAfter.setHours(0, 0, 0, 0);
            
            const dateBefore = new Date(end);
            dateBefore.setHours(23, 59, 59, 999);

            console.log('Fetching orders from', dateAfter.toISOString(), 'to', dateBefore.toISOString());

            const orders = await fetchAllOrders(dateAfter.toISOString(), dateBefore.toISOString());
            
            if (!orders || orders.length === 0) {
                setError('No orders found for the selected period.');
                setFilteredData({
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    dailyRevenue: [],
                    dailyOrders: [],
                    topProducts: [],
                    salesProducts: [],
                    ordersByStatus: {},
                    topCustomers: []
                });
                return;
            }
            
            const processedData = processOrdersData(orders);
            setFilteredData(processedData);

            console.log('Processed data:', processedData);
        } catch (error) {
            console.error('Error applying filter:', error);
            setError(`Error fetching data: ${error.message}. Please check your WooCommerce API keys and store URL.`);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        applyFilter();
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);

            setLoading(true);
            setError('');

            try {
                console.log('Loading initial data...');
                
                // Fix date handling
                const dateAfter = new Date(thirtyDaysAgo);
                dateAfter.setHours(0, 0, 0, 0);
                
                const dateBefore = new Date(today);
                dateBefore.setHours(23, 59, 59, 999);

                const orders = await fetchAllOrders(dateAfter.toISOString(), dateBefore.toISOString());
                
                if (!orders || orders.length === 0) {
                    setError('No orders found for the selected period.');
                    return;
                }
                
                const processedData = processOrdersData(orders);
                setFilteredData(processedData);
                console.log('Initial data loaded successfully:', processedData);
            } catch (error) {
                console.error('Error loading initial data:', error);
                setError(`Error loading initial data: ${error.message}. Please check your WooCommerce API keys and store URL.`);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center">
                    <TrendingUp className="mr-4 text-blue-600" size={40} />
                    WooCommerce Analytics
                </h1>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4 items-end justify-center sm:justify-start">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full sm:w-auto"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full sm:w-auto"
                            />
                        </div>
                        <button
                            onClick={applyFilter}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg w-full sm:w-auto"
                        >
                            <Filter size={18} />
                            {loading ? 'Loading...' : 'Apply Filter'}
                        </button>
                        <button
                            onClick={refreshData}
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center">
                            <AlertCircle className="mr-2" size={20} />
                            {error}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border-l-4 border-green-500 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-800 mt-2">{formatCurrency(filteredData.totalRevenue)}</p>
                        </div>
                        <div className="p-3 bg-green-500 rounded-full shadow-md">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border-l-4 border-blue-500 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Orders</p>
                            <p className="text-3xl font-bold text-blue-800 mt-2">{filteredData.totalOrders.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-500 rounded-full shadow-md">
                            <ShoppingBag className="h-8 w-8 text-white" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border-l-4 border-purple-500 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Average Order Value</p>
                            <p className="text-3xl font-bold text-purple-800 mt-2">{formatCurrency(filteredData.averageOrderValue)}</p>
                        </div>
                        <div className="p-3 bg-purple-500 rounded-full shadow-md">
                            <Package className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                {filteredData.dailyRevenue.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <Calendar className="mr-3 text-indigo-600" size={24} />
                            Daily Sales Overview
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={filteredData.dailyRevenue}>
                                <defs>
                                    <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="ordersColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6b7280" fontSize={12} />
                                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} orientation="left" label={{ value: 'Revenue (INR)', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" stroke="#6b7280" fontSize={12} orientation="right" label={{ value: 'Orders', angle: 90, position: 'insideRight' }} />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'Revenue') return formatCurrency(value);
                                        return value;
                                    }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#82ca9d" fill="url(#revenueColor)" strokeWidth={2} />
                                <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#8884d8" fill="url(#ordersColor)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <Calendar className="mr-3 text-indigo-600" size={24} />
                            Daily Sales Overview
                        </h3>
                        <div className="text-center py-10 text-gray-500">
                            No sales data available for the selected period
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <ShoppingBag className="mr-3 text-orange-600" size={24} />
                        Sales Products Table
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Number of Sales
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.salesProducts && filteredData.salesProducts.length > 0 ? (
                                    filteredData.salesProducts.map((product, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {product.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrency(product.revenue)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No sales product data available for the selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-xl">
                            <RefreshCw className="animate-spin text-blue-500" size={24} />
                            <span className="text-gray-700 font-medium">Loading analytics data...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WooCommerceAnalytics;