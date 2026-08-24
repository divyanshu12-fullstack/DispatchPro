/**
 * DispatchPro System Constants & Status Enums
 */

export const ORDER_STATUS = Object.freeze({
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RESCHEDULED: 'RESCHEDULED',
  RETURN_TO_ORIGIN: 'RETURN_TO_ORIGIN',
});

export const STATUS_META = Object.freeze({
  CREATED: {
    label: 'Order Placed',
    dotColor: 'bg-stone-400',
    description: 'Order created, awaiting dispatch',
  },
  ASSIGNED: {
    label: 'Agent Assigned',
    dotColor: 'bg-slate-600',
    description: 'Assigned to field delivery agent',
  },
  PICKED_UP: {
    label: 'Picked Up',
    dotColor: 'bg-slate-700',
    description: 'Parcel collected from pickup location',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    dotColor: 'bg-slate-800',
    description: 'Package is moving between delivery hubs',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    dotColor: 'bg-amber-500',
    description: 'Agent is en route to doorstep',
  },
  DELIVERED: {
    label: 'Delivered',
    dotColor: 'bg-accent',
    description: 'Successfully handed over with verification OTP',
  },
  FAILED: {
    label: 'Delivery Failed',
    dotColor: 'bg-danger',
    description: 'Delivery attempt unsuccessful',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    dotColor: 'bg-blue-600',
    description: 'Rescheduled for a future delivery window',
  },
  RETURN_TO_ORIGIN: {
    label: 'Returning to Origin',
    dotColor: 'bg-danger',
    description: 'Package returning back to sender',
  },
});

export const HAPPY_PATH_STEPS = Object.freeze([
  { status: ORDER_STATUS.CREATED, label: 'Placed' },
  { status: ORDER_STATUS.ASSIGNED, label: 'Assigned' },
  { status: ORDER_STATUS.PICKED_UP, label: 'Picked Up' },
  { status: ORDER_STATUS.IN_TRANSIT, label: 'In Transit' },
  { status: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { status: ORDER_STATUS.DELIVERED, label: 'Delivered' },
]);

export const FAILURE_REASONS = Object.freeze([
  'Customer Unavailable',
  'Incorrect Address',
  'Customer Refused',
  'Package Damaged',
]);

export const RESCHEDULABLE_REASONS = Object.freeze(['Customer Unavailable']);

export const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;

export const ROLE_HOME_MAP = Object.freeze({
  CUSTOMER: '/app',
  AGENT: '/agent',
  ADMIN: '/admin',
});

export const OTP_PURPOSES = Object.freeze({
  LOGIN: 'LOGIN',
  VERIFY_EMAIL: 'VERIFY_EMAIL',
});

export const ORDER_TYPES = Object.freeze({
  B2C: 'B2C',
  B2B: 'B2B',
});
