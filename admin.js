// ===============================
// 設定
// ===============================
const API_BASE = "https://script.google.com/macros/s/AKfycbyv3hzO3tvX_Glf3U6Vv5tBS6yUKweRZXOeMzyo-ecedp6RWJAwdJIQNEMpmUMASmXU/exec";

document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("admin-calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",
    dateClick: function (info) {
      loadReservations(info.dateStr);
    },
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

  // 予約
  const res = await fetch(`${API_BASE}?action=list`);
  const data = await res.json();

  data.forEach(r => {
    if (r.status === "reserved") {
      calendar.addEvent({
        title: `${r.time} ${r.name}`,
        start: `${r.date}T${r.time}`,
        color: "#4CAF50"
      });
    }
  });

  // 休み
  const hol = await fetch(`${API_BASE}?action=holidays`);
  const hdata = await hol.json();

  hdata.forEach(h => {
    calendar.addEvent({
      title: "休み",
      start: `${h.date}T${h.time}`,
      color: "#FF5252"
    });
  });
}

// ===============================
// 日付クリック → 予約一覧
// ===============================
async function loadReservations(date) {
  const res = await fetch(`${API_BASE}?action=list&date=${date}`);
  const data = await res.json();

  const area = document.getElementById("reservation-list");
  area.innerHTML = `<h3>${date} の予約一覧</h3>`;

  if (data.length === 0) {
    area.innerHTML += "<p>予約なし</p>";
    return;
  }

  data.forEach(r => {
    area.innerHTML += `
      <div class="reservation-item">
        <p><strong>${r.time}</strong> / ${r.name} / ${r.menu}</p>
        <button onclick="cancelFromAdmin('${r.id}')">キャンセル</button>
      </div>
    `;
  });
}

// ===============================
// 管理画面からキャンセル
// ===============================
async function cancelFromAdmin(id) {
  if (!confirm("本当にキャンセルしますか？")) return;

  const res = await fetch(`${API_BASE}?action=cancel`, {
    method: "POST",
    body: JSON.stringify({ reservation_id: id })
  });

  const data = await res.json();

  alert(data.message);
  location.reload();
}
