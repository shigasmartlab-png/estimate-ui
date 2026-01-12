// ★ Render にデプロイされた API の URL を設定してください
const API_BASE = "https://android-estimate-api.onrender.com";

// ------------------------
// 休みの日一覧の読み込み
// ------------------------
async function loadHolidays() {
  try {
    const res = await fetch(`${API_BASE}/holidays`);
    const data = await res.json();

    const list = document.getElementById("holiday-list");
    list.innerHTML = "";

    data.holidays.forEach(d => {
      const li = document.createElement("li");
      li.textContent = d + " ";

      const btn = document.createElement("button");
      btn.textContent = "削除";
      btn.onclick = () => removeHoliday(d);

      li.appendChild(btn);
      list.appendChild(li);
    });
  } catch (e) {
    alert("休みの日一覧の取得に失敗しました");
    console.error(e);
  }
}

// ------------------------
// 休みの日追加
// ------------------------
document.getElementById("add-holiday-btn").onclick = async () => {
  const date = document.getElementById("holiday-date").value;
  if (!date) return alert("日付を選択してください");

  try {
    const res = await fetch(`${API_BASE}/holidays/add`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({date})
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "追加に失敗しました");
      return;
    }

    alert(data.message);
    loadHolidays();
  } catch (e) {
    alert("休みの日追加でエラーが発生しました");
    console.error(e);
  }
};

// ------------------------
// 休みの日削除
// ------------------------
async function removeHoliday(date) {
  if (!confirm(`${date} を休みの日から削除しますか？`)) return;

  try {
    const res = await fetch(`${API_BASE}/holidays/remove`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({date})
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "削除に失敗しました");
      return;
    }

    alert(data.message);
    loadHolidays();
  } catch (e) {
    alert("休みの日削除でエラーが発生しました");
    console.error(e);
  }
}

// ------------------------
// 予約一覧の読み込み
// ------------------------
document.getElementById("load-list-btn").onclick = async () => {
  const date = document.getElementById("list-date").value;

  const url = date
    ? `${API_BASE}/list?date=${date}`
    : `${API_BASE}/list`;

  try {
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
  } catch (e) {
    alert("予約一覧の取得に失敗しました");
    console.error(e);
  }
};

// ------------------------
// 初期読み込み
// ------------------------
loadHolidays();

