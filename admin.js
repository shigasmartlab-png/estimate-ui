// ===============================
// 設定
// ===============================
const API_BASE = "https://android-estimate-api.onrender.com";


// ===============================
// 管理画面カレンダー初期化
// ===============================
document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("admin-calendar");

  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",

    // 日付クリック → その日の予約一覧を表示
    dateClick: function (info) {
      loadReservations(info.dateStr);
    },

    // 月が変わったらイベント再読み込み
    datesSet: async function () {
      await loadCalendarEvents(calendar);
    }
  });

  calendar.render();
  await loadCalendarEvents(calendar);
});


// ===============================
// カレンダーに予約と休みを反映
// ===============================
async function loadCalendarEvents(calendar) {
  calendar.removeAllEvents();

  // --- 予約一覧を取得 ---
  const res = await fetch(`${API_BASE}/list`);
  const data = await res.json();

  data.reservations.forEach(r => {
    if (r.status === "reserved") {
      calendar.addEvent({
        title: `${r.time} ${r.name}`,
        start: `${r.date}T${r.time}`,
        color: "#4CAF50", // 緑
      });
    }
  });

  // --- 休み時間帯を取得 ---
  const hol = await fetch(`${API_BASE}/holidays`);
  const hdata = await hol.json();

  hdata.holidays.forEach(h => {
    calendar.addEvent({
      title: "休み",
      start: `${h.date}T${h.time}`,
      color: "#FF5252", // 赤
    });
  });
}


// ===============================
// 日付クリック → 予約一覧表示
// ===============================
async function loadReservations(date) {
  const res = await fetch(`${API_BASE}/list?date=${date}`);
  const data = await res.json();

  const area = document.getElementById("reservation-list");
  area.innerHTML = `<h3>${date} の予約一覧</h3>`;

  if (data.reservations.length === 0) {
    area.innerHTML += "<p>予約なし</p>";
    return;
  }

  data.reservations.forEach(r => {
    area.innerHTML += `
      <div class="reservation-item">
        <p><strong>${r.time}</strong> / ${r.name} / ${r.menu}</p>
        <button onclick="cancelFromAdmin('${r.id}')">キャンセル</button>
        <button onclick='showDetail(${JSON.stringify(r)})'>詳細</button>
      </div>
    `;
  });
}


// ===============================
// 予約詳細ポップアップ
// ===============================
function showDetail(r) {
  alert(
    `【予約詳細】
日時：${r.date} ${r.time}
名前：${r.name}
メニュー：${r.menu}
電話/LINE：${r.phone}
ステータス：${r.status}
メモ：${r.memo}`
  );
}


// ===============================
// 管理画面からキャンセル
// ===============================
async function cancelFromAdmin(id) {
  if (!confirm("本当にキャンセルしますか？")) return;

  const res = await fetch(`${API_BASE}/cancel`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ reservation_id: id })
  });

  const data = await res.json();

  alert(data.message);
  location.reload();
}
