import axios from 'axios';
import prisma from '../config/database';
import env from '../config/env';
import { OrderStatus, PaymentStatus, PaymentMethod, UserRole } from '@prisma/client';
import { getIO } from '../socket';

// ── Khalti API helpers ────────────────────────────────

const khaltiApi = axios.create({
  baseURL: env.KHALTI_GATEWAY_URL,
  headers: {
    Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

// ── Types ─────────────────────────────────────────────

export interface KhaltiInitiateData {
  orderId: string;
  customerId: string;
}

export interface KhaltiVerifyData {
  pidx: string;
  orderId: string;
  customerId: string;
}

interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: 'Completed' | 'Pending' | 'Initiated' | 'Refunded' | 'Expired' | 'User canceled';
  transaction_id: string;
  fee: number;
  refunded: boolean;
}

// ── Initiate Khalti payment ──────────────────────────

export const initiateKhaltiPayment = async (
  data: KhaltiInitiateData
): Promise<{ pidx: string; payment_url: string }> => {
  // 1. Fetch the order and validate
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      service: { select: { name: true } },
      customer: { select: { id: true, email: true, profile: { select: { name: true, phone: true } } } },
    },
  });

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  if (order.customerId !== data.customerId) {
    throw Object.assign(new Error('Unauthorized: you do not own this order'), { statusCode: 403 });
  }

  // Only allow payment for COMPLETED orders that are not yet paid
  if (order.status !== OrderStatus.COMPLETED) {
    throw Object.assign(
      new Error(`Order must be in COMPLETED status to make payment. Current status: ${order.status}`),
      { statusCode: 400 }
    );
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw Object.assign(new Error('Order is already paid'), { statusCode: 400 });
  }

  // 2. Convert to paisa (Khalti expects amount in paisa = NPR * 100)
  const amountInPaisa = Math.round(Number(order.totalAmount) * 100);

  if (amountInPaisa < 1000 || amountInPaisa > 100000000) {
    throw Object.assign(
      new Error('Amount must be between NPR 10 and NPR 1,000,000'),
      { statusCode: 400 }
    );
  }

  // 3. Build callback URLs
  const websiteUrl = env.KHALTI_WEBSITE_URL || env.FRONTEND_URL;
  const returnUrl = `${env.FRONTEND_URL}/payment/khalti/callback`;

  // 4. Call Khalti ePayment initiate API
  try {
    const response = await khaltiApi.post<KhaltiInitiateResponse>('/epayment/initiate/', {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountInPaisa,
      purchase_order_id: order.id,
      purchase_order_name: order.service.name,
      customer_info: {
        name: order.customer.profile?.name || 'Customer',
        email: order.customer.email,
        phone: order.customer.profile?.phone || '',
      },
    });

    // 5. Create a PENDING payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        technicianAmount: order.technicianAmount,
        platformAmount: order.platformAmount,
        method: PaymentMethod.KHALTI,
        transactionId: response.data.pidx, // Use pidx as initial transactionId
        status: PaymentStatus.PENDING,
      },
    });

    // Update order payment method
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod: PaymentMethod.KHALTI },
    });

    return {
      pidx: response.data.pidx,
      payment_url: response.data.payment_url,
    };
  } catch (error: any) {
    console.error('[Khalti] Initiate error:', error?.response?.data || error.message);
    const message = error?.response?.data?.detail || 'Failed to initiate Khalti payment';
    throw Object.assign(new Error(message), { statusCode: 502 });
  }
};

// ── Verify Khalti payment ────────────────────────────

export const verifyKhaltiPayment = async (
  data: KhaltiVerifyData
): Promise<any> => {
  // 1. Fetch order
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      service: { include: { category: true } },
      customer: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, phone: true } },
        },
      },
      technician: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, phone: true, avatar: true } },
        },
      },
    },
  });

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  if (order.customerId !== data.customerId) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    // Already paid – return order as-is (idempotent)
    return order;
  }

  // 2. Call Khalti lookup API to verify
  let lookupResult: KhaltiLookupResponse;

  try {
    const response = await khaltiApi.post<KhaltiLookupResponse>('/epayment/lookup/', {
      pidx: data.pidx,
    });
    lookupResult = response.data;
  } catch (error: any) {
    console.error('[Khalti] Lookup error:', error?.response?.data || error.message);
    throw Object.assign(new Error('Failed to verify payment with Khalti'), { statusCode: 502 });
  }

  // 3. Check status
  if (lookupResult.status !== 'Completed') {
    // Mark payment as failed if not completed
    await prisma.payment.updateMany({
      where: { orderId: order.id, transactionId: data.pidx },
      data: { status: PaymentStatus.FAILED },
    });

    throw Object.assign(
      new Error(`Payment not completed. Khalti status: ${lookupResult.status}`),
      { statusCode: 400 }
    );
  }

  // 4. Verify amount matches
  const expectedPaisa = Math.round(Number(order.totalAmount) * 100);
  if (lookupResult.total_amount !== expectedPaisa) {
    await prisma.payment.updateMany({
      where: { orderId: order.id, transactionId: data.pidx },
      data: { status: PaymentStatus.FAILED },
    });

    throw Object.assign(
      new Error('Payment amount mismatch'),
      { statusCode: 400 }
    );
  }

  // 5. Update payment record with Khalti transaction ID
  await prisma.payment.updateMany({
    where: { orderId: order.id, transactionId: data.pidx },
    data: {
      status: PaymentStatus.PAID,
      transactionId: lookupResult.transaction_id || data.pidx,
      paidAt: new Date(),
    },
  });

  // 6. Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentId: lookupResult.transaction_id || data.pidx,
    },
    include: {
      service: { include: { category: true } },
      customer: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, phone: true } },
        },
      },
      technician: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, phone: true, avatar: true } },
        },
      },
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  // 7. Create booking history entry
  await prisma.bookingHistory.create({
    data: {
      orderId: order.id,
      userId: data.customerId,
      action: 'PAYMENT_COMPLETED',
      status: 'PAID',
      notes: `Payment of NPR ${Number(order.totalAmount).toLocaleString()} via Khalti (txn: ${lookupResult.transaction_id})`,
    },
  });

  // 8. Emit real-time socket events
  try {
    const io = getIO();

    const paymentPayload = {
      orderId: updatedOrder.id,
      paymentStatus: 'PAID',
      paymentMethod: 'KHALTI',
      transactionId: lookupResult.transaction_id || data.pidx,
      amount: Number(updatedOrder.totalAmount),
      order: updatedOrder,
    };

    // Notify admin(s)
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      io.to(`user:${admin.id}`).emit('paymentSuccess', paymentPayload);
    }

    // Notify technician
    if (updatedOrder.technicianId) {
      io.to(`user:${updatedOrder.technicianId}`).emit('paymentSuccess', paymentPayload);
    }

    // Notify customer (confirmation)
    io.to(`user:${data.customerId}`).emit('paymentSuccess', paymentPayload);
  } catch (socketError) {
    // Socket emission should not fail the whole payment flow
    console.error('[Payment] Socket emit error:', socketError);
  }

  return updatedOrder;
};
