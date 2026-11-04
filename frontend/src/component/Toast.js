import { useEffect, useState } from "react";
import style from "../CSS/Toast.module.css";

// 화면 위쪽에 잠깐 떴다 사라지는 알림. notify("...")로 어디서든 띄운다.
let listeners = [];
let nextId = 1;

export function notify(text, { icon = "🔔", onClick } = {}) {
  const toast = { id: nextId++, text, icon, onClick };
  listeners.forEach((listener) => listener(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (toast) => {
      setToasts((prev) => [...prev.slice(-2), toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 4000);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className={style.Stack}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={style.Toast}
          onClick={() => {
            toast.onClick?.();
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }}
        >
          <span className={style.Icon}>{toast.icon}</span>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
