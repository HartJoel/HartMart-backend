import AuditService from "../../modules/audit/audit.service.js";
import EventService from "../eventService.js";
import EventTypes from "../eventTypes.js";

export default function registerAuditListeners() {
  const record = ({
    userId,
    vendorId,
    action,
    resource,
    resourceId,
    description,
    metadata,
    ipAddress,
    userAgent,
  }) =>
    AuditService.log({
      userId,
      vendorId,
      action,
      resource,
      resourceId,
      description,
      metadata,
      ipAddress,
      userAgent,
    });

  EventService.on(EventTypes.USER_REGISTERED, (data) =>
    record({
      ...data,
      action: "CREATE",
      resource: "user",
      resourceId: data.user.id,
      description: "User registered",
    }),
  );
  EventService.on(EventTypes.USER_EMAIL_VERIFIED, (data) =>
    record({
      ...data,
      action: "VERIFY",
      resource: "user",
      resourceId: data.user.id,
      description: "Email verified",
    }),
  );
  EventService.on(EventTypes.USER_LOGGED_IN, (data) =>
    record({
      ...data,
      userId: data.user,
      action: "LOGIN",
      resource: "user",
      resourceId: data.user,
      description: "User logged in",
    }),
  );
  EventService.on(EventTypes.USER_LOGGED_OUT, (data) =>
    record({
      ...data,
      userId: data.user,
      action: "LOGOUT",
      resource: "user",
      resourceId: data.user,
      description: "User logged out",
    }),
  );
  EventService.on(EventTypes.VENDOR_APPLIED, (data) =>
    record({
      ...data,
      action: "CREATE",
      resource: "vendor",
      resourceId: data.vendor.id,
      description: "Vendor application submitted",
      metadata: { storeName: data.vendor.storeName },
    }),
  );
  EventService.on(EventTypes.VENDOR_UPDATED, (data) =>
    record({
      ...data,
      action: "UPDATE",
      resource: "vendor",
      resourceId: data.vendor.id,
      description: "Vendor profile updated",
    }),
  );
  EventService.on(EventTypes.VENDOR_VERIFIED, (data) =>
    record({
      ...data,
      action: "VERIFY",
      resource: "vendor",
      resourceId: data.vendor.id,
      description: "Vendor verified",
    }),
  );
  EventService.on(EventTypes.VENDOR_REJECTED, (data) =>
    record({
      ...data,
      action: "REJECT",
      resource: "vendor",
      resourceId: data.vendor.id,
      description: "Vendor application rejected",
      metadata: { reason: data.reason },
    }),
  );
  EventService.on(EventTypes.VENDOR_SUSPENDED, (data) =>
    record({
      ...data,
      action: "SUSPEND",
      resource: "vendor",
      resourceId: data.vendor.id,
      description: "Vendor suspended",
    }),
  );
  EventService.on(EventTypes.PRODUCT_CREATED, (data) =>
    record({
      ...data,
      action: "CREATE",
      resource: "product",
      resourceId: data.product.id,
      description: "Product created",
      metadata: { productName: data.product.name },
    }),
  );
  EventService.on(EventTypes.PRODUCT_UPDATED, (data) =>
    record({
      ...data,
      action: "UPDATE",
      resource: "product",
      resourceId: data.product.id,
      description: "Product updated",
      metadata: { productName: data.product.name },
    }),
  );
  EventService.on(EventTypes.PRODUCT_STOCK_UPDATED, (data) =>
    record({
      ...data,
      action: "UPDATE",
      resource: "product",
      resourceId: data.product.id,
      description: "Product stock updated",
      metadata: data.metadata,
    }),
  );
  EventService.on(EventTypes.PRODUCT_DELETED, (data) =>
    record({
      ...data,
      action: "DELETE",
      resource: "product",
      resourceId: data.product.id,
      description: "Product deleted",
      metadata: { productName: data.product.name },
    }),
  );
  EventService.on(EventTypes.ORDER_CREATED, (data) =>
    record({
      ...data,
      userId: data.customerId,
      action: "CREATE",
      resource: "order",
      resourceId: data.order.id,
      description: "Order created",
      metadata: { orderNumber: data.order.orderNumber },
    }),
  );
  EventService.on(EventTypes.ORDER_STATUS_UPDATED, (data) =>
    record({
      ...data,
      action: "UPDATE",
      resource: "order",
      resourceId: data.order.id,
      description: "Order status updated",
      metadata: { status: data.status },
    }),
  );
  EventService.on(EventTypes.REVIEW_POSTED, (data) =>
    record({
      ...data,
      userId: data.review.userId,
      vendorId: data.vendorId,
      action: "CREATE",
      resource: "review",
      resourceId: data.review.id,
      description: "Review created",
      metadata: { productId: data.product.id, orderId: data.review.orderId },
    }),
  );
  EventService.on(EventTypes.REVIEW_RESPONSE, (data) =>
    record({
      ...data,
      userId: data.vendorUserId,
      vendorId: data.vendorId,
      action: "UPDATE",
      resource: "review",
      resourceId: data.review.id,
      description: "Review response added",
    }),
  );
  EventService.on(EventTypes.REVIEW_UPDATED, (data) =>
    record({
      ...data,
      action: "UPDATE",
      resource: "review",
      resourceId: data.review.id,
      description: "Review updated",
    }),
  );
  EventService.on(EventTypes.REVIEW_DELETED, (data) =>
    record({
      ...data,
      action: "DELETE",
      resource: "review",
      resourceId: data.review.id,
      description: "Review deleted",
    }),
  );
}
