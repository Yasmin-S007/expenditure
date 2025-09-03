// src/api/woocommerce.js
const WOOCOMMERCE_STORE_URL = 'https://vaseegrahveda.com';
const WOOCOMMERCE_CONSUMER_KEY = 'ck_c3c710436481be9d6c4b5b04083502b0b5d225dd';
const WOOCOMMERCE_CONSUMER_SECRET = 'cs_7313e1dd00f7f703b03199852a38a0a6ec74723a';

/**
 * Encodes parameters for a URL.
 * @param {object} params - The parameters to encode.
 * @returns {string} The encoded parameter string.
 */
const encodeParams = (params) => {
    return Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
};

/**
 * Fetches data from the WooCommerce API.
 * Implements exponential backoff for robust API calls.
 * @param {string} endpoint - The API endpoint (e.g., 'orders', 'products').
 * @param {object} params - Query parameters for the API request.
 * @param {number} retries - Number of retries for the request (default: 3).
 * @param {number} delay - Initial delay in milliseconds for backoff (default: 1000).
 * @returns {Promise<Array>} A promise that resolves to an array of data from the API.
 */
const fetchWooCommerceData = async (endpoint, params = {}, retries = 3, delay = 1000) => {
    const authParams = {
        consumer_key: WOOCOMMERCE_CONSUMER_KEY,
        consumer_secret: WOOCOMMERCE_CONSUMER_SECRET,
    };

    if (!WOOCOMMERCE_STORE_URL || !WOOCOMMERCE_CONSUMER_KEY || !WOOCOMMERCE_CONSUMER_SECRET) {
        throw new Error("WooCommerce API credentials or Store URL are not set. Please check your .env file or the code.");
    }

    const queryString = encodeParams({ ...params, ...authParams });
    const url = `${WOOCOMMERCE_STORE_URL}/wp-json/wc/v3/${endpoint}?${queryString}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                console.warn(`Rate limit hit, retrying ${endpoint} in ${delay / 1000}s...`);
                await new Promise(res => setTimeout(res, delay));
                return fetchWooCommerceData(endpoint, params, retries - 1, delay * 2);
            }
            const errorText = await response.text();
            throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
};

/**
 * Fetches all orders, handling pagination automatically.
 * @param {string} dateAfter - ISO formatted date string to filter orders created after this date.
 * @param {string} dateBefore - ISO formatted date string to filter orders created before this date.
 * @returns {Promise<Array>} A promise that resolves to an array of all orders within the date range.
 */
export const fetchAllOrders = async (dateAfter, dateBefore) => {
    let allOrders = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const params = {
            per_page: perPage,
            page: page,
            after: dateAfter,
            before: dateBefore,
            status: 'any',
        };

        try {
            const orders = await fetchWooCommerceData('orders', params);
            if (orders.length === 0) {
                break;
            }
            allOrders = allOrders.concat(orders);
            page++;
        } catch (error) {
            console.error('Error fetching orders page:', page, error);
            throw error;
        }
    }
    return allOrders;
};

/**
 * Fetches a specified number of recent orders.
 * @param {number} limit - The maximum number of recent orders to fetch.
 * @param {number} page - The page number for pagination.
 * @returns {Promise<Array>} A promise that resolves to an array of recent orders.
 */
export const getRecentOrders = async (limit = 10, page = 1) => {
    const params = {
        per_page: limit,
        page: page,
        orderby: 'date',
        order: 'desc',
        status: 'any',
    };
    return fetchWooCommerceData('orders', params);
};


/**
 * Processes raw order data to extract analytics.
 * @param {Array} orders - An array of raw order objects from the WooCommerce API.
 * @returns {object} An object containing processed analytics data.
 */
export const processOrdersData = (orders) => {
    let totalRevenue = 0;
    let totalOrders = 0;
    const dailyRevenueMap = {};
    const dailyOrdersMap = {};
    const productSalesMap = {};
    const ordersByStatus = {};
    const customerAnalyticsMap = {};

    orders.forEach(order => {
        // FIX: The revenue calculation was incorrect because it was tied to the order status.
        // It should calculate revenue for all orders in the date range.
        totalRevenue += parseFloat(order.total);
        totalOrders++;

        const orderDate = order.date_created.split('T')[0];
        dailyRevenueMap[orderDate] = (dailyRevenueMap[orderDate] || 0) + parseFloat(order.total);
        dailyOrdersMap[orderDate] = (dailyOrdersMap[orderDate] || 0) + 1;

        order.line_items.forEach(item => {
            if (productSalesMap[item.name]) {
                productSalesMap[item.name].quantity += item.quantity;
                productSalesMap[item.name].revenue += parseFloat(item.total);
            } else {
                productSalesMap[item.name] = {
                    name: item.name,
                    quantity: item.quantity,
                    revenue: parseFloat(item.total),
                };
            }
        });

        const customerId = order.customer_id || order.billing.email;
        const customerName = order.billing.first_name || order.billing.last_name ? 
                             `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() :
                             `Guest (${order.billing.email})`;

        if (customerId) {
            if (!customerAnalyticsMap[customerId]) {
                customerAnalyticsMap[customerId] = {
                    name: customerName,
                    orderCount: 0,
                    totalSpent: 0,
                    avgOrderValue: 0
                };
            }
            customerAnalyticsMap[customerId].orderCount++;
            customerAnalyticsMap[customerId].totalSpent += parseFloat(order.total);
            customerAnalyticsMap[customerId].avgOrderValue = 
                customerAnalyticsMap[customerId].totalSpent / customerAnalyticsMap[customerId].orderCount;
        }

        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const dailyRevenue = Object.keys(dailyRevenueMap)
        .sort()
        .map(date => ({ date, revenue: dailyRevenueMap[date] }));

    const dailyOrders = Object.keys(dailyOrdersMap)
        .sort()
        .map(date => ({ date, orders: dailyOrdersMap[date] }));

    const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    const salesProducts = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue);

    const topCustomers = Object.values(customerAnalyticsMap)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

    return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        dailyRevenue,
        dailyOrders,
        topProducts,
        salesProducts,
        ordersByStatus,
        customerAnalytics: Object.keys(customerAnalyticsMap).length,
        topCustomers
    };
};

/**
 * Fetches orders by a specific status.
 * @param {string} status - The order status to filter by (e.g., 'pending', 'completed').
 * @param {number} limit - The maximum number of orders to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of orders with the specified status.
 */
export const fetchOrdersByStatus = async (status, limit = 10) => {
    const params = {
        per_page: limit,
        status: status,
    };
    return fetchWooCommerceData('orders', params);
};