"use client";
import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
export default function Scanner({
  onRead,
  onClose,
}: {
  onRead: (value: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let ended = false;
    let controls: IScannerControls | undefined;
    let submitted = false;
    const element = video.current;
    const stop = () => {
      controls?.stop();
      const stream = element?.srcObject;
      if (typeof MediaStream !== "undefined" && stream instanceof MediaStream)
        stream.getTracks().forEach((t) => t.stop());
      if (element) element.srcObject = null;
    };
    void import("@zxing/browser")
      .then(async ({ BrowserQRCodeReader }) => {
        if (ended || !element) return;
        controls = await new BrowserQRCodeReader().decodeFromVideoDevice(
          undefined,
          element,
          (result, _e, c) => {
            if (result && !ended && !submitted) {
              submitted = true;
              c.stop();
              stop();
              onRead(result.getText());
            }
          },
        );
        if (ended) stop();
      })
      .catch(() => {
        if (!ended)
          setError(
            "Não foi possível usar a câmera. Permita o acesso no navegador ou cole o link abaixo.",
          );
      });
    return () => {
      ended = true;
      stop();
    };
  }, [onRead]);
  return (
    <section className="panel stack" aria-label="Leitor de QR">
      <h3>Ler convite por QR</h3>
      <video
        ref={video}
        muted
        playsInline
        aria-label="Prévia da câmera"
        style={{ maxWidth: "100%", maxHeight: 280 }}
      />
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p className="muted">Aponte para o QR compartilhado pelo paciente.</p>
      )}
      <button className="button secondary" onClick={onClose}>
        Fechar câmera
      </button>
    </section>
  );
}
