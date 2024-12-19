import React from "react";

type PopupProps = {
  title: string;
  magnitude: number;
  x: number;
  y: number;
  onClose: () => void;
};

const Popup: React.FC<PopupProps> = ({ title, magnitude, x, y, onClose }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        transform: "translate(-50%, -100%)",
        backgroundColor: "white",
        fontFamily: "Arial, sans-serif",
        textAlign: "center" as const,
        padding: "8px",
        borderRadius: "4px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        zIndex: 1000,
      }}
    >
      <button
        onClick={onClose} // Appelle le callback pour fermer le popup
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          background: "none",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
          color: "red",
        }}
      >
        &times;
      </button>
      <div style={{ marginTop: "10px" }}>
        <strong style={popupStyles.title}>{title}</strong>
        <p style={popupStyles.magnitude}>Magnitude: {magnitude}</p>
      </div>
    </div>
  );
};

const popupStyles = {
  title: {
    margin: "20px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
  },
  magnitude: {
    margin: "5px 0",
    fontSize: "14px",
    color: "#555",
  },
};

export default Popup;
