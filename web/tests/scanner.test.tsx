// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Scanner from '@/features/sharing/scanner';

type Controls = { stop: () => void };
type ReadCallback = (result: { getText: () => string } | undefined, error: unknown, controls: Controls) => void;
const reader = vi.hoisted(() => ({ decode: vi.fn<(device: unknown, video: HTMLVideoElement, callback: ReadCallback) => Promise<Controls>>() }));
vi.mock('@zxing/browser', () => ({ BrowserQRCodeReader: class { decodeFromVideoDevice = reader.decode; } }));

class FakeMediaStream {
  constructor(private tracks: { stop: () => void }[]) {}
  getTracks() { return this.tracks; }
}

beforeEach(() => { reader.decode.mockReset(); vi.stubGlobal('MediaStream', FakeMediaStream); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('camera scanner lifecycle', () => {
  it('releases tracks on unmount and stops a decoder whose controls arrive later', async () => {
    const trackStop = vi.fn(); const decoderStop = vi.fn(); let finish!: (controls: Controls) => void;
    reader.decode.mockImplementation((_device, video) => {
      video.srcObject = new FakeMediaStream([{ stop: trackStop }]) as unknown as MediaStream;
      return new Promise(resolve => { finish = resolve; });
    });
    const view = render(<Scanner onRead={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => expect(reader.decode).toHaveBeenCalledTimes(1));
    view.unmount(); expect(trackStop).toHaveBeenCalledTimes(1);
    await act(async () => finish({ stop: decoderStop }));
    expect(decoderStop).toHaveBeenCalled();
  });

  it('submits one QR result and stops all camera tracks despite duplicate callbacks', async () => {
    const trackStop = vi.fn(); const decoderStop = vi.fn(); const onRead = vi.fn(); let callback!: ReadCallback;
    reader.decode.mockImplementation(async (_device, video, read) => {
      callback = read; video.srcObject = new FakeMediaStream([{ stop: trackStop }]) as unknown as MediaStream;
      return { stop: decoderStop };
    });
    render(<Scanner onRead={onRead} onClose={vi.fn()} />);
    await waitFor(() => expect(reader.decode).toHaveBeenCalledTimes(1));
    act(() => { callback({ getText: () => 'demo-consultation' }, undefined, { stop: decoderStop }); callback({ getText: () => 'demo-followup' }, undefined, { stop: decoderStop }); });
    expect(onRead).toHaveBeenCalledTimes(1); expect(onRead).toHaveBeenCalledWith('demo-consultation');
    expect(trackStop).toHaveBeenCalledTimes(1); expect(screen.getByLabelText('Prévia da câmera').getAttribute('src')).toBeNull();
  });

  it('offers recovery after camera permission is denied and closes on request', async () => {
    const onClose = vi.fn(); const onRead = vi.fn();
    reader.decode.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    render(<Scanner onRead={onRead} onClose={onClose} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar câmera' })); expect(onClose).toHaveBeenCalledTimes(1); expect(onRead).not.toHaveBeenCalled();
  });

  it('ignores a QR callback after the scanner is closed', async () => {
    let callback!: ReadCallback; const stop = vi.fn(); const onRead = vi.fn();
    reader.decode.mockImplementation(async (_device, _video, read) => { callback = read; return { stop }; });
    const view = render(<Scanner onRead={onRead} onClose={vi.fn()} />);
    await waitFor(() => expect(reader.decode).toHaveBeenCalledTimes(1)); view.unmount();
    act(() => callback({ getText: () => 'demo-consultation' }, undefined, { stop }));
    expect(onRead).not.toHaveBeenCalled(); expect(stop).toHaveBeenCalled();
  });

  it('cleans up safely when the browser has no MediaStream constructor', async () => {
    vi.stubGlobal('MediaStream', undefined);
    reader.decode.mockRejectedValue(new Error('Camera unsupported'));
    const view = render(<Scanner onRead={vi.fn()} onClose={vi.fn()} />);
    await screen.findByRole('alert');
    expect(() => view.unmount()).not.toThrow();
  });
});
