import { describe, expect, it } from 'vitest';
import { allowedOperation, safeReturnTo } from '@/lib/api/proxy-policy';

describe('HTTP bridge boundary', () => {
  it.each([
    ['GET', 'session'], ['GET', 'patients/patient-1/snapshot'],
    ['POST', 'patients/patient-1/reviews'], ['POST', 'sharing/resolve'],
    ['GET', 'patients/patient-1/documents/document-1/content'],
  ])('allows the contract operation %s %s', (method, path) => {
    expect(allowedOperation(method, path)).toBe(true);
  });

  it.each([
    ['DELETE', 'patients/patient-1/snapshot'], ['POST', 'patients/patient-1/snapshot'],
    ['GET', 'https://other.example/session'], ['GET', '//other.example/session'],
    ['GET', '../session'], ['GET', 'patients/../session'],
    ['GET', 'patients/%2e%2e/snapshot'], ['GET', 'patients/patient-1/approve'],
    ['POST', 'follow-up-requests/request-1/approve'], ['GET', '__test'],
    ['GET', 'patients/patient-1/snapshot?upstream=https://other.example'],
  ])('rejects method/path outside the transport boundary: %s %s', (method, path) => {
    expect(allowedOperation(method, path)).toBe(false);
  });

  it.each([null, '/doctor', '/doctor/patients', '/doctor/consultation'])('allows a local doctor return %s', path => {
    expect(safeReturnTo(path)).toBe(true);
  });

  it.each(['https://other.example', '//other.example', '/doctor/../outside', '/doctor%2fpatients', '/doctor\\patients', '/doctor?returnTo=https://other.example', '/doctor/#outside', '/doctors'])('rejects ambiguous or external login return %s', path => {
    expect(safeReturnTo(path)).toBe(false);
  });
});
