import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { answerCustomer, answerOps, retrieve } from '../services/ai.service.js';
import { hasOpenRouterKey } from '../services/embeddings.service.js';
import Order from '../../models/Order.js';

const router = Router();

/**
 * POST /api/ai/chat — CUSTOMER (and ADMIN) RAG chat.
 * Body: { query: string, orderNumber?: string }
 * - query: user question (required, 2-500 chars)
 * - orderNumber: optional LM-... for dynamic tool context (scoped to own orders)
 *
 * Guardrails: never selects deliveryOtpHash/passwordHash, rate-limited via 15s timeout in service.
 */
router.post(
  '/chat',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN', 'AGENT'),
  asyncHandler(async (req, res) => {
    const query = String(req.body?.query ?? req.body?.q ?? '').trim();
    const orderNumber = req.body?.orderNumber ? String(req.body.orderNumber).trim() : null;

    if (!query || query.length < 2) throw ApiError.badRequest('query is required (2-500 chars)');
    if (query.length > 500) throw ApiError.badRequest('query too long (max 500 chars)');

    // Optional live order context — strictly scoped to requester's own orders (ADMIN can see any).
    let orderContext = null;
    if (orderNumber) {
      const order = await Order.findOne({ orderNumber })
        .select('orderNumber currentStatus pickupPincode dropPincode scheduledDeliveryDate pricing failedAttemptCount assignmentAttempts needsManualAttention customer placedBy')
        .lean();
      if (!order) {
        orderContext = `Order ${orderNumber} not found.`;
      } else {
        const isOwner =
          req.user.role === 'ADMIN' ||
          String(order.customer) === req.user.id ||
          String(order.placedBy) === req.user.id;
        if (!isOwner) {
          // Non-owner: do not leak existence details beyond generic.
          throw ApiError.forbidden('You do not have access to that order');
        }
        orderContext = `Order ${order.orderNumber}: status=${order.currentStatus}, route ${order.pickupPincode}->${order.dropPincode}, scheduled=${order.scheduledDeliveryDate?.toISOString?.().slice(0, 10) ?? 'n/a'}, total=Rs ${order.pricing?.totalAmount ?? 'n/a'}, failedAttempts=${order.failedAttemptCount ?? 0}, needsAttention=${!!order.needsManualAttention}`;
      }
    }

    // Quick health check: no key => service will fallback to extractive, but warn.
    const fallbackNotice = hasOpenRouterKey() ? null : 'OPENROUTER_API_KEY not set — using extractive fallback';

    const result = await answerCustomer(query, { userId: req.user.id, orderContext });

    res.json({
      success: true,
      data: {
        answer: result.answer,
        sources: result.sources,
        model: result.model,
        ...(result.usage ? { usage: result.usage } : {}),
        ...(fallbackNotice ? { notice: fallbackNotice } : {}),
        ...(result.error ? { warning: result.error.slice(0, 300) } : {}),
      },
    });
  })
);

/**
 * POST /api/ai/ops — ADMIN only, Ops copilot (aggregations + RAG).
 * Body: { query: string, zone?: string }
 * In v1, aggregations are live counts injected as extra context for the LLM.
 */
router.post(
  '/ops',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const query = String(req.body?.query ?? req.body?.q ?? '').trim();
    if (!query || query.length < 2) throw ApiError.badRequest('query is required (2-500 chars)');
    if (query.length > 800) throw ApiError.badRequest('query too long (max 800 chars)');

    // Minimal live aggregations for demo — never includes OTPs/hashes.
    // Keep queries light; no table scans beyond indexed counts.
    const stuckCount = await Order.countDocuments({ currentStatus: 'FAILED' });
    const rtoCount = await Order.countDocuments({ currentStatus: 'RETURN_TO_ORIGIN' });
    const createdCount = await Order.countDocuments({ currentStatus: 'CREATED' });
    const needsAttention = await Order.countDocuments({ needsManualAttention: true });

    // If query mentions a zone/pincode, try to scope (best-effort, not strict).
    const zoneHint = String(req.body?.zone || '').trim();
    let zoneNote = '';
    if (zoneHint) {
      const zoneScoped = await Order.countDocuments({
        currentStatus: { $in: ['CREATED', 'FAILED'] },
        $or: [{ pickupPincode: zoneHint }, { dropPincode: zoneHint }],
      });
      zoneNote = ` Orders matching zone/pincode '${zoneHint}': ${zoneScoped}.`;
    }

    const liveNote = `Live ops snapshot: FAILED=${stuckCount}, RTO=${rtoCount}, CREATED(queued)=${createdCount}, needsManualAttention=${needsAttention}.${zoneNote} Sweep retries every 5 min up to 3 attempts.`;
    // Inject liveNote by prepending to query context: answerOps will retrieve RAG and LLM will see liveNote as extra.
    // Simplest: temporarily override by calling answerOps and then stitching liveNote into response header.
    const result = await answerOps(`${query}\n\n[Live snapshot for grounding, do not hallucinate beyond it: ${liveNote}]`);

    res.json({
      success: true,
      data: {
        answer: result.answer,
        live: { stuckCount, rtoCount, createdCount, needsManualAttention: needsAttention },
        sources: result.sources,
        model: result.model,
        ...(result.usage ? { usage: result.usage } : {}),
        ...(result.error ? { warning: result.error.slice(0, 300) } : {}),
      },
    });
  })
);

/**
 * GET /api/ai/retrieve — debug retrieval (ADMIN only) — helps verify vector search without LLM cost.
 * Query: ?q=how+reschedule&topK=3
 */
router.get(
  '/retrieve',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const q = String(req.query?.q || '').trim();
    if (!q) throw ApiError.badRequest('q is required');
    const topK = Math.min(Math.max(parseInt(String(req.query.topK || '3'), 10) || 3, 1), 5);
    const hits = await retrieve(q, { topK });
    res.json({
      success: true,
      data: hits.map((h) => ({
        title: h.chunk.title,
        category: h.chunk.category,
        sourceId: h.chunk.sourceId,
        trusted: h.chunk.trusted,
        score: Number(h.score.toFixed(4)),
        boostedScore: Number(h.boostedScore.toFixed(4)),
        preview: h.chunk.text.slice(0, 260),
      })),
    });
  })
);

export default router;
