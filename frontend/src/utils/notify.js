export const showWebNotification = ({
  title,
  body,
  icon = "/logo.png",
  onClick,
  enabled = true,
}) => {
  if (!enabled || !("Notification" in window)) return;

  if (Notification.permission === "granted" && !document.hasFocus()) {
    // 🔊 Play notification sound
    const audio = new Audio("/sounds/message.mp3");
    audio.play().catch((e) => {
      console.warn("🔇 Could not play notification sound:", e.message);
    });

    // 🔔 Show native notification
    const notification = new Notification(title, {
      body,
      icon,
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }

    setTimeout(() => {
      notification.close();
    }, 5000);
  }
};
