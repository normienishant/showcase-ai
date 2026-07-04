// lib/tracking.ts
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

interface TrackEventParams {
  eventType: string;
  productId?: string;
  categoryId?: string;
  data?: Record<string, any>;
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const response = await fetch(`${API_URL}/track/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        eventType: params.eventType,
        productId: params.productId,
        categoryId: params.categoryId,
        data: params.data,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      console.error('Tracking failed:', await response.text());
    }
  } catch (error) {
    console.debug('Tracking error:', error);
  }
}

export function trackPageView(path: string) {
  trackEvent({ eventType: 'page_view', data: { path } });
}
export function trackProductView(productId: string) {
  trackEvent({ eventType: 'product_view', productId });
}
export function trackSearch(query: string) {
  trackEvent({ eventType: 'search', data: { query } });
}
export function trackWishlistAdd(productId: string) {
  trackEvent({ eventType: 'wishlist_add', productId });
}
export function trackWishlistRemove(productId: string) {
  trackEvent({ eventType: 'wishlist_remove', productId });
}
export function trackPDFDownload(productIds: string[]) {
  trackEvent({ eventType: 'pdf_download', data: { productIds } });
}
export function trackAIChat(query: string, response: string) {
  trackEvent({ eventType: 'ai_chat', data: { query, response } });
}
export function trackLeadSubmit(leadId: string) {
  trackEvent({ eventType: 'lead_submit', data: { leadId } });
}