export interface TrackedOrder {
    id: string;
    order_number: string;
    customer_email: string;
    customer_name: string;
    total_amount: number;
    created_at: string;
}

export const saveClientOrder = async (order: TrackedOrder): Promise<boolean> => {
    try {
        const ORDERS_KEY = 'pizzeria_client_orders';
        const existingOrdersStr = localStorage.getItem(ORDERS_KEY);
        const existingOrders: TrackedOrder[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];

        // Check if order already exists
        if (!existingOrders.some(o => o.id === order.id)) {
            const updatedOrders = [order, ...existingOrders];
            localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

            // Also set as active order for immediate tracking
            localStorage.setItem('pizzeria_active_order', JSON.stringify(order));

            console.log('✅ Order saved to local history:', order.order_number);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to save client order tracking:', error);
        return false;
    }
};

export const getClientOrders = (): TrackedOrder[] => {
    try {
        const ORDERS_KEY = 'pizzeria_client_orders';
        const existingOrdersStr = localStorage.getItem(ORDERS_KEY);
        return existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    } catch (error) {
        console.error('Failed to retrieve client orders:', error);
        return [];
    }
};

export const getActiveOrder = (): TrackedOrder | null => {
    try {
        const activeOrderStr = localStorage.getItem('pizzeria_active_order');
        return activeOrderStr ? JSON.parse(activeOrderStr) : null;
    } catch (error) {
        return null;
    }
}
