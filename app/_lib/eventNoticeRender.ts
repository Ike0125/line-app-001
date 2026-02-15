// ===============================
// SWF event notice HTML renderer
// （状態表ベース実装）
// ===============================

const DEFAULT_FIXED_MESSAGE = "中止の場合は、当日の朝８時までに掲示します";

type Status = "開催" | "中止" | "初期設定" | "お知らせ" | "非表示";

// 状態ごとの表示仕様（= 仕様そのもの）
const STATUS_RULES: Record<
  Status,
  {
    showEventTitle: boolean;        //イベントタイトル
    showMessage: boolean;          //message+prependFixedMessage
    prependFixedMessage: boolean;  //初期設定用の固定文書
    message: boolean;              //message
  }
> = {
  開催:     { showEventTitle: true,  showMessage: true,  prependFixedMessage: false, message: true  },
  中止:     { showEventTitle: true,  showMessage: true,  prependFixedMessage: false, message: true  },
  初期設定: { showEventTitle: false, showMessage: true,  prependFixedMessage: true,  message: false }, // 例：入力文は出さない
  お知らせ: { showEventTitle: false, showMessage: true,  prependFixedMessage: false, message: true  },
  非表示:   { showEventTitle: false, showMessage: false, prependFixedMessage: false, message: false },
};

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function statusStyle(status: Status) {
  switch (status) {
    case "開催":
      return { bg: "#e6f4ea", fg: "#1e4620", border: "#34a853", label: "【本日：イベント開催します】" };
    case "中止":
      return { bg: "#fce8e6", fg: "#a50e0e", border: "#ea4335", label: "【本日：イベント中止します】" };
    case "初期設定":
      return { bg: "#f3f4f6", fg: "#111827", border: "#9ca3af", label: "【開催情報】" };
    case "お知らせ":
      return { bg: "#fff7ed", fg: "#7c2d12", border: "#fb923c", label: "【お知らせ】" };
    case "非表示":
      return { bg: "#ffffff", fg: "#111827", border: "#ffffff", label: "" };
  }
}

// 不正なstatusを防御（未知値は初期設定扱い）
function normalizeStatus(status: string): Status {
  switch (status) {
    case "開催":
    case "中止":
    case "初期設定":
    case "お知らせ":
    case "非表示":
      return status;
    default:
      return "初期設定"; // 安全側フォールバック
  }
}

export function renderEventNoticeHtml(params: {
  status: string;
  eventTitle?: string | null;
  message?: string | null;
}) {
  const status = normalizeStatus(params.status);
  const { eventTitle, message } = params;

  const rule = STATUS_RULES[status];

  // 非表示は完全非表示
  if (status === "非表示") {
    return '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
  }

  const st = statusStyle(status);

  // 入力 message は “入力” として扱い、表示するかは rule.message で決める
  const userMessage = rule.message ? (message ?? "") : "";

  const mergedMessage = rule.showMessage
    ? rule.prependFixedMessage
      ? userMessage.trim()
        ? `${DEFAULT_FIXED_MESSAGE}\n${userMessage}`
        : DEFAULT_FIXED_MESSAGE
      : userMessage
    : "";

  const safeEvent =
    rule.showEventTitle && eventTitle ? escapeHtml(eventTitle) : "";

  const safeMsg =
    rule.showMessage && mergedMessage
      ? escapeHtml(mergedMessage).replaceAll("\n", "<br>")
      : "";

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SWF 開催通知</title>
  <style>
    body { margin:0; padding:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif; }
    .wrap { padding: 10px; }
    .box {
      border-left: 6px solid ${st.border};
      background: ${st.bg};
      color: ${st.fg};
      padding: 10px 12px;
      border-radius: 8px;
      line-height: 1.4;
    }
    .status { font-weight: 800; font-size: 18px; margin-bottom: 6px; }
    .event  { font-weight: 700; font-size: 16px; margin-bottom: 6px; }
    .msg    { font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="box">
      <div class="status">${escapeHtml(st.label)}</div>
      ${safeEvent ? `<div class="event">${safeEvent}</div>` : ""}
      ${safeMsg ? `<div class="msg">${safeMsg}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
}
