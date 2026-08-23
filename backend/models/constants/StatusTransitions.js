import { ORDER_STATUS } from './OrderStatus.js';

export const VALID_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.CREATED]:            [ORDER_STATUS.ASSIGNED],
  [ORDER_STATUS.ASSIGNED]:           [ORDER_STATUS.PICKED_UP],
  [ORDER_STATUS.PICKED_UP]:          [ORDER_STATUS.IN_TRANSIT],
  [ORDER_STATUS.IN_TRANSIT]:         [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]:   [ORDER_STATUS.DELIVERED, ORDER_STATUS.FAILED, ORDER_STATUS.RETURN_TO_ORIGIN],
  [ORDER_STATUS.FAILED]:             [ORDER_STATUS.CREATED],
  [ORDER_STATUS.DELIVERED]:          [],
  [ORDER_STATUS.RETURN_TO_ORIGIN]:   [],
  [ORDER_STATUS.RESCHEDULED]:        [],
});

export const TRANSITION_ROLES = Object.freeze({
  [ORDER_STATUS.ASSIGNED]:           ['ADMIN', 'SYSTEM'],
  [ORDER_STATUS.PICKED_UP]:          ['AGENT', 'ADMIN'],
  [ORDER_STATUS.IN_TRANSIT]:         ['AGENT', 'ADMIN'],
  [ORDER_STATUS.OUT_FOR_DELIVERY]:   ['AGENT', 'ADMIN'],
  [ORDER_STATUS.DELIVERED]:          ['AGENT', 'ADMIN'],
  [ORDER_STATUS.FAILED]:             ['AGENT', 'ADMIN'],
  [ORDER_STATUS.RETURN_TO_ORIGIN]:   ['AGENT', 'ADMIN'],
  [ORDER_STATUS.CREATED]:            ['CUSTOMER', 'ADMIN'],
});

export const FAILURE_REASONS = Object.freeze({
  CUSTOMER_UNAVAILABLE: 'Customer Unavailable',
  INCORRECT_ADDRESS:    'Incorrect Address',
  CUSTOMER_REFUSED:     'Customer Refused',
  PACKAGE_DAMAGED:      'Package Damaged',
});

export const FAILURE_REASON_VALUES = Object.freeze(Object.values(FAILURE_REASONS));

export const RESCHEDULABLE_REASONS = Object.freeze([
  FAILURE_REASONS.CUSTOMER_UNAVAILABLE,
]);

export const MAX_FAILED_ATTEMPTS = 2;

export function isValidTransition(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

export function canActorTransition(toStatus, role) {
  const allowed = TRANSITION_ROLES[toStatus];
  return Array.isArray(allowed) && allowed.includes(role);
}
