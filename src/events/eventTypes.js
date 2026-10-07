const EventTypes = {
  USER_REGISTERED: "user.registered",
  USER_EMAIL_VERIFIED: "user.email.verified",
  USER_LOGGED_IN: "user.logged.in",
  USER_LOGGED_OUT: "user.logged.out",
  VENDOR_APPLIED: "vendor.applied",
  VENDOR_UPDATED: "vendor.updated",
  VENDOR_REJECTED: "vendor.rejected",
  VENDOR_SUSPENDED: "vendor.suspended",
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_STOCK_UPDATED: "product.stock.updated",
  PRODUCT_DELETED: "product.deleted",
  ORDER_STATUS_UPDATED: "order.status.updated",
  REVIEW_UPDATED: "review.updated",
  REVIEW_DELETED: "review.deleted",
  ORDER_CREATED: "order.created",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",

  PAYMENT_RECEIVED: "payment.received",
  PAYMENT_FAILED: "payment.failed",

  VENDOR_VERIFIED: "vendor.verified",

  REVIEW_POSTED: "review.posted",
  REVIEW_RESPONSE: "review.response",
};

export default EventTypes;
