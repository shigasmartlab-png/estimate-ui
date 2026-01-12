// ★ Render にデプロイされた API の URL を設定してください
const API_BASE = "https://android-estimate-api.onrender.com";

// ------------------------
// 一括登録
// ------------------------
document.getElementById("add-multiple-btn").onclick = async () => {
  const date = document.getElementById("holiday-date").value;
  if (!date) return alert("日付を選択してください");

  const checkboxes = document.querySelectorAll("#time-checkboxes input[type='checkbox']");
  const selectedTimes = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);

  if (selectedTimes.length === 0) {
    alert("時間帯を選択してください");
    return;
  }

  for (const time of selectedTimes) {
    await fetch(`${API_BASE}/holidays/add`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({date, time})
    });
  }

  alert("休み時間帯を登録しました");
  loadHolidayCalendar();
};

// ------------------------
// カレンダー表示
// ------------------------
async function loadHolidayCalendar() {
  const res = await fetch(`${API_BASE}/holidays`);
  const data = await res.json();

  const calendar = document.getElementById("holiday-calendar");
  calendar.innerHTML = "";

  const grouped = {};
  data.holidays.forEach(h => {
    if (!grouped[h.date]) grouped[h.date] = [];
    grouped[h.date].push(h.time);
  });

  Object.keys(grouped).sort().forEach(date => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>${date}</h3>`;

    grouped[date].sort().forEach(time => {
      const span = document.createElement("span");
      span.className = "time-block";
      span.textContent = time;
      div.appendChild(span);
    });

    calendar.appendChild(div);
  });
}

// ------------------------
// 予約一覧
// ------------------------
document.getElementById("load-list-btn").onclick = async () => {
  const date = document.getElementById("list-date").value;

  const url = date ? `${API_BASE}/list?date=${date}` : `${API_BASE}/list`;

  const res = await fetch(url);
  const data = await res.json();

  const list = document.getElementById("reservation-list");
  list.innerHTML = "";

  if (data.reservations.length === 0) {
    list.innerHTML = "<li>予約はありません</li>";
    return;
  }

  data.reservations.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${r.date} ${r.time}</strong><br>
      ${r.name}（${r.phone}）<br>
      メニュー：${r.menu}<br>
      状態：${r.status}<br>
      予約ID：${r.id}
    `;
    list.appendChild(li);
  });
};

// ------------------------
// 初期読み込み
// ------------------------
loadHolidayCalendar();
