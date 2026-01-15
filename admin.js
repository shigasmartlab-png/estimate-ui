const API_BASE = "https://script.google.com/macros/s/AKfycbw8g4hkq1L0H4xRxM-apkkJD-iH3-bgMOtl968iREhrg1KDXQZ7otbuUQ1WiJNh_nsq/exec";

// 予約一覧を読み込む
async function loadReservations() {
  const res = await fetch(`${API_BASE}?action=list`);
  const data = await res.json();

  const tbody = document.querySelector("#reservation-table tbody");
  tbody.innerHTML = "";

  data.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.date}</td>
      <td>${r.time}</td>
      <td>${r.name}</td>
      <td>${r.menu}</td>
      <td>${r.status}</td>
      <td>
        ${r.status === "reserved"
          ? `<button class="cancel-btn" onclick="cancelReservation('${r.id}')">キャンセル</button>`
          : `-`
        }
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// キャンセル処理
async function cancelReservation(id) {
  if (!confirm(`予約ID「${id}」をキャンセルしますか？`)) return;

  const payload = { reservation_id: id };

  const res = await fetch(`${API_BASE}?action=cancel`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.message) {
    alert("キャンセルしました");
    loadReservations();
  } else {
    alert("キャンセルに失敗しました");
  }
}

// 初回ロード
loadReservations();
