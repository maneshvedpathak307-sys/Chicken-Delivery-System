import React, { useEffect, useRef, useState } from "react";
import "../styles/ImageCropModal.css";

const SIZE = 320;

export default function ImageCropModal({ image, onCancel, onCrop }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let active = true;
    const img = new Image();

    setLoaded(false);
    setImageError("");
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });

    img.onload = () => {
      if (!active) return;
      imageRef.current = img;
      setLoaded(true);
    };

    img.onerror = () => {
      if (!active) return;
      setImageError("Unable to load this image. Please select another.");
    };

    img.src = image;

    return () => {
      active = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [image]);

  useEffect(() => {
    if (!loaded || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw a circular crop preview.
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "#f3f3f3";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.translate(SIZE / 2, SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Fit the rotated image inside the circular crop area.
    const rotated = Math.abs(rotation % 180) === 90;
    const effectiveWidth = rotated ? img.naturalHeight : img.naturalWidth;
    const effectiveHeight = rotated ? img.naturalWidth : img.naturalHeight;

    const scale =
      Math.max(SIZE / effectiveWidth, SIZE / effectiveHeight) * zoom;

    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;

    ctx.drawImage(
      img,
      -width / 2 + position.x,
      -height / 2 + position.y,
      width,
      height
    );

    ctx.restore();

    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [loaded, zoom, rotation, position]);

  const handlePointerDown = (event) => {
    if (!loaded || processing) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    const drag = dragRef.current;

    setPosition({
      x: drag.x + event.clientX - drag.startX,
      y: drag.y + event.clientY - drag.startY,
    });
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  const resetCrop = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded || processing) return;

    setProcessing(true);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setProcessing(false);
          setImageError("Unable to crop this image. Please try again.");
          return;
        }

        const file = new File([blob], "profile-photo.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        onCrop(file);
        setProcessing(false);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div
      className="image-crop-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) {
          onCancel();
        }
      }}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget && !processing) {
          onCancel();
        }
      }}
    >
      <section
        className="image-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        <header className="image-crop-header">
          <div>
            <h2 id="crop-modal-title">Crop Profile Photo</h2>
            <p>Drag the image to position it inside the circle.</p>
          </div>

          <button
            type="button"
            className="image-crop-close"
            onClick={onCancel}
            disabled={processing}
            aria-label="Close crop window"
          >
            ×
          </button>
        </header>

        <div className="image-crop-area">
          {loaded ? (
            <canvas
              ref={canvasRef}
              className="image-crop-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onLostPointerCapture={stopDragging}
              aria-label="Drag to position your profile photo"
            />
          ) : (
            <p className="image-crop-loading">
              {imageError || "Loading image..."}
            </p>
          )}
        </div>

        <p className="crop-instruction">
          Drag the photo to adjust its position.
        </p>

        {imageError && loaded && (
          <p className="image-crop-error" role="alert">
            {imageError}
          </p>
        )}

        <div className="image-crop-controls">
          <label className="crop-control-group" htmlFor="crop-zoom">
            <span>Zoom</span>
            <input
              id="crop-zoom"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              disabled={!loaded || processing}
            />
            <span>{zoom.toFixed(1)}×</span>
          </label>

          <div className="crop-rotation-buttons">
            <button
              type="button"
              onClick={() => setRotation((value) => value - 90)}
              disabled={!loaded || processing}
            >
              ↶ Rotate Left
            </button>

            <button
              type="button"
              onClick={() => setRotation((value) => value + 90)}
              disabled={!loaded || processing}
            >
              Rotate Right ↷
            </button>

            <button
              type="button"
              onClick={resetCrop}
              disabled={!loaded || processing}
            >
              Reset
            </button>
          </div>
        </div>

        <footer className="image-crop-footer">
          <button
            type="button"
            className="image-crop-cancel"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </button>

          <button
            type="button"
            className="image-crop-confirm"
            onClick={handleConfirm}
            disabled={!loaded || processing}
          >
            {processing ? "Processing..." : "✓ Crop & Use Photo"}
          </button>
        </footer>
      </section>
    </div>
  );
}