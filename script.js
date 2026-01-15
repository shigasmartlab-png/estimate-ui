// ===============================
// 設定
// ===============================
const API_BASE = "https://android-estimate-api.onrender.com";

let formData = {};


// メニューごとの所要時間（分）
const MENU_DURATION = {
  screen: 60,   // 画面修理
  battery: 60,  // バッテリー交換
  coating: 20,  // ガラスコーティング
  multi: 90     // 複数（デフォルト値、後で上書きも可）
};


// ===============================
// ステップ切り替え
// ===============================
function showStep(id) {
  document.querySelectorAll(".step").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}
showStep("cancel_box");


// ===============================
// 前へ戻る（入力保持）
// ===============================
function backTo(stepId) {
  restoreInputs(stepId);
  showStep(stepId);
}


// ===============================
// 入力復元
// ===============================
function restoreInputs(stepId) {

  if (stepId === "step1") {
    document.getElementById("name").value = formData.name || "";
    document.getElementById("line_name").value = formData.line_name || "";
    document.getElementById("address").value = formData.address || "";
  }

  if (stepId === "step2") {
    if (formData.menu) {
      document.querySelector(`input[name="menu"][value="${formData.menu}"]`).checked = true;
    }
    document.getElementById("is_delivery").checked = !!formData.is_delivery;
  }

  if (stepId === "step_screen") {
    if (formData.screen_os) {
      document.querySelector(`input[name="screen_os"][value="${formData.screen_os}"]`).checked = true;
    }
    document.getElementById("screen_model").value = formData.screen_model || "";
    if (formData.screen_quality) {
      document.querySelector(`input[name="screen_quality"][value="${formData.screen_quality}"]`).checked = true;
    }
  }

  if (stepId === "step_battery") {
    if (formData.battery_os) {
      document.querySelector(`input[name="battery_os"][value="${formData.battery_os}"]`).checked = true;
    }
    document.getElementById("battery_model").value = formData.battery_model || "";
    if (formData.battery_quality) {
      document.querySelector(`input[name="battery_quality"][value="${formData.battery_quality}"]`).checked = true;
    }
  }

  if (stepId === "step_coating") {
    if (formData.coat_type) {
      document.querySelector(`input[name="coat_type"][value="${formData.coat_type}"]`).checked = true;
    }
  }

  if (stepId === "step_multi") {
    if (formData.multi_menu) {
      formData.multi_menu.forEach(v => {
        const cb = document.querySelector(`input[name="multi_menu"][value="${v}"]`);
        if (cb) cb.checked = true;
      });
    }
  }

  if (stepId === "step_multi_detail") {
    if (formData.multi_os) {
      document.querySelector(`input[name="multi_os"][value="${formData.multi_os}"]`).checked = true;
    }
    document.getElementById("multi_model").value = formData.multi_model || "";

    if (formData.multi_battery) {
      document.querySelector(`input[name="multi_battery"][value="${formData.multi_battery}"]`).checked = true;
    }
    if (formData.multi_screen) {
      document.querySelector(`input[name="multi_screen"][value="${formData.multi_screen}"]`).checked = true;
    }
  }
}


// ===============================
// STEP1 → STEP2
// ===============================
function goStep2() {
  formData.name = document.getElementById("name").value;
  formData.line_name = document.getElementById("line_name").value;
  formData.address = document.getElementById("address").value;

  if (!formData.name || !formData.line_name || !formData.address) {
    alert("すべて入力してください");
    return;
  }

  showStep("step2");
}


// ===============================
// STEP2 → メニュー別画面
// ===============================
function selectMenu() {
  const menu = document.querySelector("input[name='menu']:checked");
  if (!menu) return alert("メニューを選択してください");

  formData.menu = menu.value;
  formData.is_delivery = document.getElementById("is_delivery").checked;

  if (menu.value === "screen") showStep("step_screen");
  if (menu.value === "battery") showStep("step_battery");
  if (menu.value === "coating") showStep("step_coating");
  if (menu.value === "multi") showStep("step_multi");
}


// ===============================
// STEP3-A：画面修理
// ===============================
function saveScreen() {
  const os = document.querySelector("input[name='screen_os']:checked");
  const quality = document.querySelector("input[name='screen_quality']:checked");

  if (!os || !quality) return alert("すべて選択してください");

  formData.screen_os = os.value;
  formData.screen_model = document.getElementById("screen_model").value;
  formData.screen_quality = quality.value;

  if (!formData.screen_model) return alert("機種詳細を入力してください");

  showStep("step5");
}


// ===============================
// STEP3-B：バッテリー交換
// ===============================
function saveBattery() {
  const os = document.querySelector("input[name='battery_os']:checked");
  const quality = document.querySelector("input[name='battery_quality']:checked");

  if (!os || !quality) return alert("すべて選択してください");

  formData.battery_os = os.value;
  formData.battery_model = document.getElementById("battery_model").value;
  formData.battery_quality = quality.value;

  if (!formData.battery_model) return alert("機種詳細を入力してください");

  showStep("step5");
}


// ===============================
// STEP3-C：ガラスコーティング
// ===============================
function saveCoating() {
  const type = document.querySelector("input[name='coat_type']:checked");
  if (!type) return alert("選択してください");

  formData.coat_type = type.value;

  showStep("step5");
}


// ===============================
// STEP3-D：複数メニュー
// ===============================
function saveMultiMenu() {
  const selected = [...document.querySelectorAll("input[name='multi_menu']:checked")]
    .map(cb => cb.value);

  if (selected.length === 0) return alert("1つ以上選択してください");

  formData.multi_menu = selected;

  showStep("step_multi_detail");
}


// ===============================
// 複数メニューの所要時間計算
// ===============================
function calcMultiDuration() {
  let total = 0;

  if (!formData.multi_menu) return MENU_DURATION.multi;

  if (formData.multi_menu.includes("screen")) total += 60;
  if (formData.multi_menu.includes("battery")) total += 30;
  if (formData.multi_menu.includes("coat_screen")) total += 15;
  if (formData.multi_menu.includes("coat_both")) total += 25;

  return total || MENU_DURATION.multi;
}


// ===============================
// 総所要時間（出張＋2時間込み）
// ===============================
function getTotalDuration() {
  let base;

  if (formData.menu === "multi") {
    base = calcMultiDuration();
  } else {
    base = MENU_DURATION[formData.menu];
  }

  if (formData.is_delivery) {
    base += 120;
  }

  return base;
}


// ===============================
// STEP4：複数用の機種入力
// ===============================
function saveMultiDetail() {
  const os = document.querySelector("input[name='multi_os']:checked");
  if (!os) return alert("機種を選択してください");

  formData.multi_os = os.value;
  formData.multi_model = document.getElementById("multi_model").value;

  if (!formData.multi_model) return alert("機種詳細を入力してください");

  const battery = document.querySelector("input[name='multi_battery']:checked");
  const screen = document.querySelector("input[name='multi_screen']:checked");

  formData.multi_battery = battery ? battery.value : "none";
  formData.multi_screen = screen ? screen.value : "none";

  showStep("step5");
}


// ===============================
// STEP5：FullCalendar 初期化
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",
    selectable: true,
    dateClick: function (info) {
      selectDate(info.dateStr);
    }
  });

  calendar.render();
});


// ===============================
// 日付を選択 → 空き時間取得
// ===============================
async function selectDate(dateStr) {
  formData.selectedDate = dateStr;

  const duration = getTotalDuration();

  const res = await fetch(`${API_BASE}/availability?date=${dateStr}&duration=${duration}`);
  const data = await res.json();

  const timeArea = document.getElementById("time-slots");
  timeArea.innerHTML = "";

  if (!Array.isArray(data)) {
    timeArea.innerHTML = `<p>空き時間の取得に失敗しました：${data.detail || "不明なエラー"}</p>`;
    console.error("availability API error:", data);
    return;
  }

  if (data.length === 0) {
    timeArea.innerHTML = "<p>空き時間がありません</p>";
    return;
  }

  data.forEach(time => {
    const btn = document.createElement("button");
    btn.textContent = time;
    btn.onclick = () => selectTime(time);
    timeArea.appendChild(btn);
  });
}



// ===============================
// 時間を選択 → 第1〜第3希望に自動登録
// ===============================
function selectTime(time) {
  if (!formData.date1) {
    formData.date1 = formData.selectedDate;
    formData.time1 = time;
    alert("第1希望を登録しました");
  } else if (!formData.date2) {
    formData.date2 = formData.selectedDate;
    formData.time2 = time;
    alert("第2希望を登録しました");
  } else if (!formData.date3) {
    formData.date3 = formData.selectedDate;
    formData.time3 = time;
    alert("第3希望を登録しました");
    document.getElementById("next-to-confirm").style.display = "block";
  } else {
    alert("すでに3つ選択済みです");
  }
}


// ===============================
// 確認画面へ
// ===============================
function goToConfirm() {
  buildConfirm();
  showStep("step6");
}


// ===============================
// STEP6：確認画面
// ===============================
function buildConfirm() {
  const area = document.getElementById("confirm-area");

  area.innerHTML = `
    <h3>基本情報</h3>
    <p>名前：${formData.name}</p>
    <p>LINE表示名：${formData.line_name}</p>
    <p>住所：${formData.address}</p>

    <h3>メニュー</h3>
    <p>${formData.menu}</p>
    <p>出張対応：${formData.is_delivery ? "あり（＋2時間）" : "なし"}</p>

    <h3>希望日</h3>
    <p>第1希望：${formData.date1} ${formData.time1}</p>
    <p>第2希望：${formData.date2} ${formData.time2}</p>
    <p>第3希望：${formData.date3} ${formData.time3}</p>

    <h3>予約ID</h3>
    <p>${formData.reservation_id || "送信時に発行されます"}</p>

    <h3>詳細情報（メモ）</h3>
    <pre>${JSON.stringify(formData, null, 2)}</pre>
  `;
}


// ===============================
// 予約ID生成（B方式：YYYYMMDD-1234）
// ===============================
function generateReservationId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const rand = Math.floor(1000 + Math.random() * 9000);

  return `${y}${m}${day}-${rand}`;
}


// ===============================
// API送信
// ===============================
async function submitForm() {

  formData.reservation_id = generateReservationId();

  const payload = {
    reservation_id: formData.reservation_id,
    date: formData.date1,
    time: formData.time1,
    name: formData.name,
    phone: formData.line_name,
    menu: formData.menu,
    is_delivery: formData.is_delivery,
    memo: JSON.stringify(formData)
  };

  try {
    const res = await fetch(`${API_BASE}/reserve`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert("予約エラー：" + data.detail);
      return;
    }

    alert("予約が完了しました！");
    window.location.href = `thanks.html?rid=${formData.reservation_id}`;

  } catch (e) {
    alert("通信エラーが発生しました");
    console.error(e);
  }
}


// ===============================
// 予約キャンセル
// ===============================
async function cancelReservation() {
  const rid = document.getElementById("cancel_id").value;

  if (!rid) {
    alert("予約IDを入力してください");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cancel?reservation_id=${rid}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      alert("キャンセルエラー：" + data.detail);
      return;
    }

    alert("予約をキャンセルしました");
    location.reload();

  } catch (e) {
    alert("通信エラーが発生しました");
    console.error(e);
  }
}
