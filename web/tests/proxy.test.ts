import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/doctor/v0/[...path]/route';
import { allowedOperation, safeReturnTo } from '@/lib/api/proxy-policy';

const origin = 'https://doctor.example';
const upstream = 'https://backend.example/api/doctor/v0/';
const context = (path: string) => ({ params: Promise.resolve({ path: path.split('/') }) });
const request = (path: string, method = 'GET', headers: Record<string, string> = {}, body?: string) => new NextRequest(`${origin}/api/doctor/v0/${path}`, { method, headers, body });

beforeEach(() => { vi.stubEnv('DOCTOR_API_UPSTREAM_URL', upstream); vi.stubEnv('DOCTOR_AUTH_REDIRECT_ORIGINS', 'https://identity.example'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('proxy allowlist', () => {
  it.each([
    ['GET', 'session'], ['GET', 'auth/start'], ['POST', 'auth/logout'], ['GET', 'patients'],
    ['POST', 'sharing/resolve'], ['POST', 'follow-up-requests'], ['GET', 'follow-up-requests/request-1'],
    ['GET', 'patients/patient-1/access'], ['GET', 'patients/patient-1/snapshot'], ['GET', 'patients/patient-1/updates'],
    ['POST', 'patients/patient-1/reviews'], ['GET', 'patients/patient-1/documents/doc-1/content'], ['POST', 'temporary-access/context-1/close'],
  ])('allows only the documented %s %s', (method, path) => expect(allowedOperation(method, path)).toBe(true));

  it.each([
    ['DELETE', 'patients/patient-1'], ['POST', 'patients/patient-1/snapshot'], ['GET', 'sharing/resolve'],
    ['GET', 'patients/../session'], ['GET', 'https://evil.example'], ['GET', '//evil.example'],
    ['GET', 'patients/patient%2fother/snapshot'], ['POST', 'grants/grant-1/approve'], ['POST', 'identity/create'],
  ])('rejects %s %s', (method, path) => expect(allowedOperation(method, path)).toBe(false));

  it.each(['https://evil.example', '//evil.example', '/doctor/../../admin', '/doctor\\admin', '/doctor?returnTo=https://evil.example', '/doctor/%2f%2fevil.example'])('rejects unsafe authentication return %s', path => expect(safeReturnTo(path)).toBe(false));
});

describe('transport-only Next bridge', () => {
  it('returns a recoverable configuration error without contacting a fallback', async () => {
    vi.stubEnv('DOCTOR_API_UPSTREAM_URL', ''); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const result = await GET(request('session'), context('session'));
    expect(result.status).toBe(503); expect((await result.json()).code).toBe('UPSTREAM_NOT_CONFIGURED'); expect(fetcher).not.toHaveBeenCalled();
  });

  it('preserves cookies, CSRF, idempotency, body, status and private no-store', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 'ACCESS_REVOKED' }, { status: 403, headers: [['Set-Cookie', 'doctor_session=opaque; HttpOnly; Path=/'], ['Set-Cookie', 'consultation_session=opaque; HttpOnly; Path=/']] }));
    vi.stubGlobal('fetch', fetcher);
    const result = await POST(request('patients/patient-1/reviews', 'POST', { origin, cookie: 'doctor_session=current', 'x-csrf-token': 'csrf', 'idempotency-key': 'intention', 'content-type': 'application/json' }, '{"snapshotId":"snapshot-1","reviewToken":"proof"}'), context('patients/patient-1/reviews'));
    expect(result.status).toBe(403); expect(result.headers.get('cache-control')).toBe('no-store, private');
    expect(result.headers.getSetCookie()).toHaveLength(2);
    const [target, options] = fetcher.mock.calls[0]; expect(String(target)).toBe(`${upstream}patients/patient-1/reviews`);
    expect(options?.cache).toBe('no-store'); expect(options?.redirect).toBe('manual');
    const headers = new Headers(options?.headers); expect(headers.get('cookie')).toBe('doctor_session=current'); expect(headers.get('x-csrf-token')).toBe('csrf'); expect(headers.get('idempotency-key')).toBe('intention');
    expect(new TextDecoder().decode(options?.body as ArrayBuffer)).toContain('snapshot-1');
  });

  it.each([{ origin }, { 'x-csrf-token': 'csrf' }, { origin: 'https://evil.example', 'x-csrf-token': 'csrf' }] as Record<string, string>[])('blocks POST without valid same-origin and CSRF headers', async headers => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const result = await POST(request('sharing/resolve', 'POST', headers), context('sharing/resolve'));
    expect(result.status).toBe(403); expect(fetcher).not.toHaveBeenCalled();
  });

  it('preserves query parameters with a fixed upstream origin', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({})); vi.stubGlobal('fetch', fetcher);
    await GET(request('patients/patient-1/access?temporaryAccessId=context-1'), context('patients/patient-1/access'));
    const target = fetcher.mock.calls[0][0] as URL; expect(target.origin).toBe('https://backend.example'); expect(target.searchParams.get('temporaryAccessId')).toBe('context-1');
  });

  it.each(['file:///private', 'https://user:pass@backend.example', 'https://backend.example?url=evil'])('rejects unsafe server configuration %s', async configured => {
    vi.stubEnv('DOCTOR_API_UPSTREAM_URL', configured); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const result = await GET(request('session'), context('session')); expect(result.status).toBe(503); expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not transport unsupported operations', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const result = await POST(request('grants/grant-1/approve', 'POST', { origin, 'x-csrf-token': 'csrf' }), context('grants/grant-1/approve'));
    expect(result.status).toBe(404); expect(fetcher).not.toHaveBeenCalled();
  });

  it('allows only configured authentication redirect origins', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://evil.example/auth' } })).mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://identity.example/auth' } })); vi.stubGlobal('fetch', fetcher);
    const blocked = await GET(request('auth/start?returnTo=/doctor/patients'), context('auth/start')); expect(blocked.status).toBe(502);
    const allowed = await GET(request('auth/start?returnTo=/doctor/patients'), context('auth/start')); expect(allowed.status).toBe(302); expect(allowed.headers.get('location')).toBe('https://identity.example/auth');
  });

  it('does not redirect clinical reads to another page', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 302, headers: { location: '/doctor' } })));
    const result = await GET(request('patients/patient-1/snapshot'), context('patients/patient-1/snapshot')); expect(result.status).toBe(502);
  });

  it.each(['application/pdf', 'image/png', 'image/jpeg'])('streams an authorized %s original with sandbox and no-store', async mime => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('content', { headers: { 'content-type': mime } })));
    const path = 'patients/patient-1/documents/doc-1/content'; const result = await GET(request(path), context(path));
    expect(result.status).toBe(200); expect(result.headers.get('content-security-policy')).toContain('sandbox'); expect(result.headers.get('cache-control')).toContain('no-store'); expect(await result.text()).toBe('content');
  });

  it('rejects executable HTML served as a clinical original', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('<script>unsafe</script>', { headers: { 'content-type': 'text/html' } })));
    const path = 'patients/patient-1/documents/doc-1/content'; const result = await GET(request(path), context(path));
    expect(result.status).toBe(502); expect(await result.text()).not.toContain('<script>');
  });

  it('does not expose upstream network error messages', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('private upstream credential')));
    const result = await GET(request('session'), context('session'));
    expect(result.status).toBe(503); expect(await result.text()).not.toContain('private upstream credential');
  });
});
