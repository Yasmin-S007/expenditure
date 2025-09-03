import React, { useState, useEffect } from 'react';
import { Calendar, Tag, DollarSign, Edit, Trash2, PlusCircle, Filter, TrendingUp, RefreshCw, Printer, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// --- SUB-CATEGORIES MAPPING ---
const initialSubCategories = {
    'Operating Expenses': ['Employee Salaries & Wages', 'Marketing & Advertising Costs', 'Office Rent & Lease', 'Utilities', 'Office Supplies', 'Legal & Professional Charges', 'IT & Software', 'Fuel / Transportation Costs', 'Research & Development (R&D)', 'Insurance & Loan Payments', 'Maintenance & Repairs', 'Security Services', 'Subscriptions & Membership Fees'],
    'Travel & Commuting': ['Public Transport', 'Parking Fees', 'Vehicle / Automobile Costs', 'Business Travel (Flights, Hotels, Car Rentals)'],
    'Cost of Goods Sold': ['Raw Material Costs', 'Labor / Worker Costs', 'Manufacturing & Production Costs', 'Freight & Shipping Charges', 'Other COGS Costs'],
    'Non-Operating Expenses': ['Loan Interest Payments', 'Taxes', 'Losses', 'Other Non-Operating Costs'],
    'Food': ['Groceries', 'Restaurant', 'Coffee Shops', 'Snacks'],
    'Clothing': ['Saree', 'Chudidar', 'Jeans', 'T-shirt'],
};

const Expenditures = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        type: 'Expense',
        category: '',
        subCategory: '',
        description: '',
        amount: '',
        paymentMode: '',
        remark: ''
    });

    const [categories, setCategories] = useState(Object.keys(initialSubCategories));
    const [subCategories, setSubCategories] = useState(initialSubCategories);

    const [filteredCategories, setFilteredCategories] = useState(categories);
    const [filteredSubCategories, setFilteredSubCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showTopCosts, setShowTopCosts] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/expenditures');
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            const data = await response.json();
            setTransactions(data);
            setFilteredTransactions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, category: value, subCategory: '' });
        const filtered = categories.filter(cat => cat.toLowerCase().includes(value.toLowerCase()));
        setFilteredCategories(filtered);
        setShowCategoryDropdown(true);
        setShowSubCategoryDropdown(false);
    };

    const handleSubCategoryChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, subCategory: value });
        const relatedSubs = subCategories[formData.category] || [];
        const filtered = relatedSubs.filter(sub => sub.toLowerCase().includes(value.toLowerCase()));
        setFilteredSubCategories(filtered);
        setShowSubCategoryDropdown(true);
    };

    const selectCategory = (category) => {
        setFormData({ ...formData, category, subCategory: '' });
        setShowCategoryDropdown(false);
        setFilteredSubCategories(subCategories[category] || []);
    };

    const selectSubCategory = (sub) => {
        setFormData({ ...formData, subCategory: sub });
        setShowSubCategoryDropdown(false);
    };

    const handleAddTransaction = async () => {
        if (!formData.date || !formData.amount || !formData.category || !formData.paymentMode) {
            setError('Please fill in all required fields.');
            return;
        }

        const newTransaction = {
            ...formData,
            amount: parseFloat(formData.amount),
        };

        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/expenditures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTransaction)
            });
            if (!response.ok) {
                throw new Error('Failed to add transaction');
            }
            const addedTransaction = await response.json();
            const updatedTransactions = [addedTransaction, ...transactions];
            setTransactions(updatedTransactions);
            setFilteredTransactions(updatedTransactions);
            setFormData({
                date: '',
                type: 'Expense',
                category: '',
                subCategory: '',
                description: '',
                amount: '',
                paymentMode: '',
                remark: ''
            });
            setShowTopCosts(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewCategory = (e) => {
        e.preventDefault();
        if (formData.category && !categories.includes(formData.category)) {
            setCategories(prevCategories => [...prevCategories, formData.category]);
            setSubCategories(prevSubCategories => ({ ...prevSubCategories, [formData.category]: [] }));
            setFilteredCategories([]);
            setShowCategoryDropdown(false);
        }
    };

    const handleAddNewSubCategory = (e) => {
        e.preventDefault();
        if (formData.subCategory && formData.category && !subCategories[formData.category]?.includes(formData.subCategory)) {
            setSubCategories(prevSubCategories => {
                const updatedSubs = [...(prevSubCategories[formData.category] || []), formData.subCategory];
                return {
                    ...prevSubCategories,
                    [formData.category]: updatedSubs
                };
            });
            setFilteredSubCategories([]);
            setShowSubCategoryDropdown(false);
        }
    };

    const applyDateFilter = () => {
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

        const filtered = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= new Date(end.setDate(end.getDate() + 1));
        });
        setFilteredTransactions(filtered);
        setShowTopCosts(false);
        setError('');
    };

    const toggleTopCosts = () => {
        if (!showTopCosts) {
            const expenseTransactions = filteredTransactions.filter(t => t.type === 'Expense');
            const sorted = [...expenseTransactions].sort((a, b) => b.amount - a.amount);
            setFilteredTransactions(sorted);
        } else {
            setFilteredTransactions(transactions);
            applyDateFilter();
        }
        setShowTopCosts(!showTopCosts);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('transactionTable').outerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to restore event listeners and state
    };

    const handleDownload = () => {
        const headers = ['Date', 'Type', 'Category', 'Sub-Category', 'Description', 'Amount', 'Payment Mode', 'Remark'];
        const rows = filteredTransactions.map(t => [
            new Date(t.date).toLocaleDateString('en-IN'),
            t.type,
            t.category,
            t.subCategory || 'N/A',
            t.description || 'N/A',
            t.amount,
            t.paymentMode,
            t.remark || 'N/A'
        ]);

        let csvContent = headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'transactions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalIncome = filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = totalIncome - totalExpenses;

    const topCostData = filteredTransactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

    const sortedTopCostData = Object.entries(topCostData)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center">
                    <DollarSign className="mr-4 text-green-600" size={40} />
                    Expenditures Module
                </h1>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center mb-8">
                        {error}
                    </div>
                )}

                {/* Add Transaction Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <PlusCircle className="mr-3 text-blue-600" size={24} />
                        Add New Transaction
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                            <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                <option value="Expense">Expense</option>
                                <option value="Income">Income</option>
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                onFocus={() => setShowCategoryDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                                className="input-field"
                                placeholder="Search or add category"
                                required
                            />
                            {showCategoryDropdown && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                    {filteredCategories.length > 0 ? (
                                        filteredCategories.map((cat, index) => (
                                            <li
                                                key={index}
                                                onMouseDown={() => selectCategory(cat)}
                                                className="p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                {cat}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-2 text-gray-500 flex justify-between items-center">
                                            No match found.
                                            <button
                                                onMouseDown={handleAddNewCategory}
                                                className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                + Add "{formData.category}"
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                        {formData.category && (
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Category</label>
                                <input
                                    type="text"
                                    name="subCategory"
                                    value={formData.subCategory}
                                    onChange={handleSubCategoryChange}
                                    onFocus={() => setShowSubCategoryDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowSubCategoryDropdown(false), 200)}
                                    className="input-field"
                                    placeholder="Search or add sub-category"
                                />
                                {showSubCategoryDropdown && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                        {filteredSubCategories.length > 0 ? (
                                            filteredSubCategories.map((sub, index) => (
                                                <li
                                                    key={index}
                                                    onMouseDown={() => selectSubCategory(sub)}
                                                    className="p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                                >
                                                    {sub}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-2 text-gray-500 flex justify-between items-center">
                                                No match found.
                                                <button
                                                    onMouseDown={handleAddNewSubCategory}
                                                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    + Add "{formData.subCategory}"
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
                            <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                            <select
                                name="paymentMode"
                                value={formData.paymentMode}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            >
                                <option value="">Select a payment mode</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="GPay">GPay</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Remark (optional)</label>
                            <input type="text" name="remark" value={formData.remark} onChange={handleInputChange} className="input-field" />
                        </div>
                    </div>
                    <div className="flex justify-center mt-8">
                        <button onClick={handleAddTransaction} disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </div>

                {/* Filters and Top Cost Button */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
                        </div>
                        <button onClick={applyDateFilter} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors transform hover:scale-105 w-full sm:w-auto mt-4 sm:mt-0">
                            <Filter size={18} /> Filter
                        </button>
                    </div>
                    <button
                        onClick={toggleTopCosts}
                        className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg w-full sm:w-auto ${showTopCosts ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                        <TrendingUp size={18} />
                        {showTopCosts ? 'Hide Top Costs' : 'Show Top Costs'}
                    </button>
                </div>

                {/* Total Amounts Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg p-6 border-l-4 border-indigo-500 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Total Amount</p>
                            <p className="text-3xl font-bold text-indigo-800 mt-2">₹{totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-indigo-500 rounded-full shadow-md">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border-l-4 border-green-500 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Total Income</p>
                            <p className="text-3xl font-bold text-green-800 mt-2">₹{totalIncome.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-green-500 rounded-full shadow-md">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6 border-l-4 border-red-500 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Total Expenses</p>
                            <p className="text-3xl font-bold text-red-800 mt-2">₹{totalExpenses.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-red-500 rounded-full shadow-md">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                {/* Top Cost Chart */}
                {showTopCosts && filteredTransactions.some(t => t.type === 'Expense') && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <TrendingUp className="mr-3 text-orange-600" size={24} />
                            Top Expenses by Category
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sortedTopCostData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                <Bar dataKey="amount" fill="#ef4444" name="Amount" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Transactions Table */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <Calendar className="mr-3 text-purple-600" size={24} />
                            Transaction Records
                        </h2>
                        <div className="flex space-x-2">
                            <button onClick={handlePrint} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition-colors">
                                <Printer size={18} /> Print
                            </button>
                            <button onClick={handleDownload} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition-colors">
                                <Download size={18} /> Download CSV
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden" id="transactionTable">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(transaction.date).toLocaleDateString('en-IN')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                                            <td className="px-6 py-4 whitespace-now-wrap text-sm text-gray-500">{transaction.subCategory || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-now-wrap text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">{transaction.description || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{transaction.amount.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.paymentMode}</td>
                                            <td className="px-6 py-4 whitespace-now-wrap text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">{transaction.remark || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No transactions found for this period.</td>
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
                            <span className="text-gray-700 font-medium">Loading transactions...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Expenditures;