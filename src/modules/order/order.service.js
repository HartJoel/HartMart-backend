import OrderRespository from "./order.repository.js";
import { nanoid } from "nanoid";
import AppError from "../../shared/utils/AppError.js";
import VendorRepository from "../vendor/vendor.repository.js";
import NotificationService from "../notification/notification.service.js";
import EventService from "../../events/eventService.js";
import EventTypes from "../../events/eventTypes.js";
import logger from "../../shared/utils/logger.js";

const withDisplayItems = (order) => ({
  ...order,
  items: order.items?.map((item) => {
    const { product, ...storedItem } = item;
    return {
      ...storedItem,
      productId: item.productId,
      name: product?.name ?? null,
      image: Array.isArray(product?.images) ? product.images[0] ?? null : null,
      quantity: item.quantity,
      // OrderItem.unitPrice is captured when the order is placed.
      unitPrice: item.unitPrice,
    };
  }),
});

class OrderService {
  static async createOrder(userId, payload) {
    const cartItems = await OrderRespository.getCart(userId);

    if (!cartItems.length) {
      throw new AppError("Your cart is empty. Add an item before placing an order.", 400);
    }

    const address = await OrderRespository.getDefaultAddress(userId);

    if (!address) {
      throw new AppError("Add a default shipping address before placing an order.", 409);
    }

    let subtotal = 0;

    const orderItems = cartItems.map((item) => {
      const price = Number(
        item.product.discountPrice || item.product.basePrice || 0,
      );
      const qty = Number(item.quantity || 0);

      const totalPrice = price * qty;
      subtotal += totalPrice;

      return {
        productId: item.productId,
        vendorId: item.product.vendorId,
        quantity: qty,
        unitPrice: price.toString(),
        totalPrice: totalPrice.toString(),
        selectedVariation: item.selectedVariation,
      };
    });

    const taxAmount = subtotal * 0.05;
    const shippingCost = 10;
    let discountAmount = 0;

    const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;

    // CREATE ORDER
    const order = await OrderRespository.create({
      orderNumber: nanoid(10),
      customerId: userId,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      shippingCost: shippingCost.toString(),
      discountAmount: discountAmount.toString(),
      totalAmount: totalAmount.toString(),
      shippingAddress: JSON.stringify(address),
      customerNotes: payload.customerNotes,
      status: "PENDING",
    });

    await OrderRespository.createOrderItems(
      orderItems.map((item) => ({
        ...item,
        orderId: order.id,
      })),
    );

    await OrderRespository.addTimeline({
      orderId: order.id,
      status: "PENDING",
      note: "Order created",
    });

    await OrderRespository.clearCart(userId);

    EventService.emit(EventTypes.ORDER_CREATED, {
      order,
      orderItems,
      customerId: userId,
    });
    logger.info("Order created", { orderId: order.id, orderNumber: order.orderNumber, customerId: userId, amount: Number(order.totalAmount), vendorIds: [...new Set(orderItems.map((item) => item.vendorId).filter(Boolean))], itemCount: orderItems.length });

    return withDisplayItems(await OrderRespository.findById(order.id));
  }

  static async getOrderTimeline(orderId) {
    return await OrderRespository.getTimeline(orderId);
  }

  static async getOrder(orderId) {
    const order = await OrderRespository.findById(orderId);
    if (!order) throw new AppError("Order not found.", 404);
    return withDisplayItems(order);
  }

  static async getUserOrders(userId) {
    const orders = await OrderRespository.findByCustomer(userId);
    return orders.map(withDisplayItems);
  }

  static async getVendorOrders(userId) {
    const vendor = await VendorRepository.findUserId(userId);

    const orders = await OrderRespository.getVendorOrders(vendor.id);
    return orders.map(withDisplayItems);
  }

  static async updateOrderStatus(orderId, status) {
    const order = await OrderRespository.updateStatus(orderId, status);
    EventService.emit(EventTypes.ORDER_STATUS_UPDATED, { userId: order.customerId, order, status });
    if (status === "SHIPPED") {
      EventService.emit(EventTypes.ORDER_SHIPPED, { userId: order.customerId, order });
    }
    if (status === "DELIVERED") {
      EventService.emit(EventTypes.ORDER_DELIVERED, { userId: order.customerId, order });
    }
    logger.info("Order status updated", { orderId, customerId: order.customerId, status });
    return order;
  }
}

export default OrderService;
