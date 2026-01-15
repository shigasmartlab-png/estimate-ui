// ★ Render にデプロイされた API の URL を設定してください
const API_BASE = "https://android-estimate-api.onrender.com";

/* =========================================================
   ① 休み時間帯の一括登録
========================================================= */
document.getElementById("add-multiple-btn").addEventListener("click", async () => {
  const date = document.getElementById("holiday-date").value;
  if (!date) return alert("日付を選択してください");

  const times = [...document.querySelectorAll("#time-checkboxes input:checked")]
    .map(cb => cb.value);

  if (times.length === 0) return alert("時間帯を選択してください");

  const res = await fetch(`${API_BASE}/admin/holiday`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, times })
  });

  const data = await res.json();
  if (!res.ok) return alert("登録エラー：" + data.detail);

  alert("休み時間帯を登録しました");
  loadHolidayCalendar();
  loadHolidayEditList();
});


/* =========================================================
   ② 休みカレンダー
========================================================= */
async function loadHolidayCalendar() {
  const calendarEl = document.getElementById("holiday-calendar");
  if (!calendarEl) return;

  const res = await fetch(`${API_BASE}/admin/holiday`);
  const holidays = await res.json();

  const events = holidays.map(h => ({
    title: `休み: ${h.times.join(", ")}`,
    start: h.date
  }));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",
    events
  });

  calendar.render();
}

document.addEventListener("DOMContentLoaded", loadHolidayCalendar);


/* =========================================================
   ③ 休み編集 UI
========================================================= */
async function loadHolidayEditList() {
  const container = document.getElementById("holiday-edit-list");
  if (!container) return;

  const res = await fetch(`${API_BASE}/admin/holiday`);
  const holidays = await res.json();

  container.innerHTML = "";

  holidays.forEach(h => {
    const div = document.createElement("div");
    div.textContent = `${h.date}：${h.times.join(", ")}`;
    div.onclick = () => startHolidayEdit(h);
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", loadHolidayEditList);

let editingHoliday = null;

function startHolidayEdit(holiday) {
  editingHoliday = holiday;

  document.getElementById("holiday-edit-box").style.display = "block";
  document.getElementById("edit-date").textContent = `日付：${holiday.date}`;

  const box = document.getElementById("edit-time-checkboxes");
  box.innerHTML = "";

  const times = [
    "09:00","10:00","11:00","12:00","13:00",
    "14:00","15:00","16:00","17:00","18:00",
    "19:00","20:00","21:00"
  ];

  times.forEach(t => {
    const checked = holiday.times.includes(t) ? "checked" : "";
    box.innerHTML += `
      <label style="margin-right:10px;">
        <input type="checkbox" value="${t}" ${checked}> ${t}
      </label>
    `;
  });
}

async function saveHolidayEdit() {
  const times = [...document.querySelectorAll("#edit-time-checkboxes input:checked")]
    .map(cb => cb.value);

  if (times.length === 0) return alert("1つ以上選択してください");

  const res = await fetch(`${API_BASE}/admin/holiday`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: editingHoliday.date,
      times
    })
  });

  const data = await res.json();
  if (!res.ok) return alert("更新エラー：" + data.detail);

  alert("休みを更新しました");

  document.getElementById("holiday-edit-box").style.display = "none";
  loadHolidayCalendar();
  loadHolidayEditList();
}

async function deleteHoliday() {
  if (!confirm("本当に削除しますか？")) return;

  const res = await fetch(`${API_BASE}/admin/holiday?date=${editingHoliday.date}`, {
    method: "DELETE"
  });

  const data = await res.json();
  if (!res.ok) return alert("削除エラー：" + data.detail);

  alert("休みを削除しました");

  document.getElementById("holiday-edit-box").style.display = "none";
  loadHolidayCalendar();
  loadHolidayEditList();
}

function cancelHolidayEdit() {
  document.getElementById("holiday-edit-box").style.display = "none";
}


/* =========================================================
   ④ 予約カレンダー
========================================================= */
document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("reservation-calendar");
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",

    eventClick: function (info) {
      showReservationDetail(info.event.extendedProps);
    }
  });

  const reservations = await loadReservations();

  reservations.forEach(r => {
    calendar.addEvent({
      title: `${r.time} ${r.name}`,
      start: `${r.date}T${r.time}`,
      extendedProps: r
    });
  });

  calendar.render();
});


async function loadReservations() {
  try {
    const res = await fetch(`${API_BASE}/admin/reservations`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("予約一覧取得エラー:", e);
    return [];
  }
}

function showReservationDetail(props) {
  const box = document.getElementById("reservation-detail");
  const content = document.getElementById("detail-content");

  content.innerHTML = `
    <strong>予約ID：</strong> ${props.reservation_id}<br>
    <strong>名前：</strong> ${props.name}<br>
    <strong>メニュー：</strong> ${props.menu}<br>
    <strong>日付：</strong> ${props.date}<br>
    <strong>時間：</strong> ${props.time}<br>
    <strong>出張：</strong> ${props.is_delivery ? "あり" : "なし"}
  `;

  box.style.display = "block";
}

function closeDetail() {
  document.getElementById("reservation-detail").style.display = "none";
}
