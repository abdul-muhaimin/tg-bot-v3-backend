export default function ErrorScreen({ type }) {
  const screens = {
    not_started: {
      emoji: "🤖",
      title: "Start the Bot First",
      message:
        "Please open @YourBotUsername and press Start before using this app.",
    },
    banned: {
      emoji: "🚫",
      title: "Account Suspended",
      message:
        "Your account has been suspended. Please contact support for assistance.",
    },
    system_closed: {
      emoji: "🔴",
      title: "System Closed",
      message: "The system is currently closed. Please check back later.",
    },
    generic: {
      emoji: "⚠️",
      title: "Something went wrong",
      message: "Unable to connect. Please close and reopen the app.",
    },
  };

  const screen = screens[type] || screens.generic;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center page-enter"
      style={{ background: "var(--tg-theme-bg-color)" }}
    >
      <div className="text-6xl mb-6">{screen.emoji}</div>
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: "var(--tg-theme-text-color)" }}
      >
        {screen.title}
      </h1>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--tg-theme-hint-color)" }}
      >
        {screen.message}
      </p>
    </div>
  );
}
