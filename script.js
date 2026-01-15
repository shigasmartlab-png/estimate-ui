// ===============================
// 設定（GAS Web API URL）
// ===============================
const API_BASE = "https://script.google.com/macros/s/AKfycbxciqi3LNoy6ucjd8xfOKTDVQao5LldGNotbRucemKqG65BWMrJg0cCqt4WFePrb9gt/exec";

let formData = {};

const MENU_DURATION = {
  screen: 60,
  battery: 60,
  coating: 20,
  multi: 90
};

// ===============================
// ステップ切り替え
// ===============================
function showStep(id) {
  document.querySelectorAll(".step").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}
showStep("step1");


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
// メニュー選択
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
// 所要時間計算
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

function getTotalDuration() {
  let base = formData.menu === "multi"
    ? calcMultiDuration()
    : MENU_DURATION[formData.menu];

  if (formData.is_delivery) base += 120;
  return base;
}


// ===============================
// 各メニュー保存
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

function saveCoating() {
  const type = document.querySelector("input[name='coat_type']:checked");
  if (!type) return alert("選択してください");

  formData.coat_type = type.value;

  showStep("step5");
}

function saveMultiMenu() {
  const selected = [...document.querySelectorAll("input[name='multi_menu']:checked")]
    .map(cb => cb.value);

  if (selected.length === 0) return alert("1つ以上選択してください");

  formData.multi_menu = selected;

  showStep("step_multi_detail");
}

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
// FullCalendar 初期化
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",
    dateClick: function (info) {
      selectDate(info.dateStr);
    }
  });

  calendar.render();
});


// ===============================
// 空き時間取得（GAS）
// ===============================
async function selectDate(dateStr) {
  formData.selectedDate = dateStr;

  const duration = getTotalDuration();

  const url = `${API_BASE}?action=availability&date=${dateStr}&duration=${duration}`;
  const res = await fetch(url);
  const data = await res.json();

  const timeArea = document.getElementById("time-slots");
  timeArea.innerHTML = "";

  data.slots.forEach(slot => {
    const btn = document.createElement("button");
    btn.textContent = slot.time;

    if (slot.available) {
      btn.onclick = () => selectTime(slot.time);
    } else {
      btn.disabled = true;
      btn.style.background = "#ccc";
      btn.style.color = "#666";
    }

    timeArea.appendChild(btn);
  });
}


// ===============================
// 時間選択
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
  `;

  showStep("step6");
}


// ===============================
// 予約送信（GAS）
// ===============================
async function submitForm() {
  const payload = {
    date: formData.date1,
    time: formData.time1,
    name: formData.name,
    phone: formData.line_name,
    menu: formData.menu,
    memo: JSON.stringify(formData)
  };

  const res = await fetch(`${API_BASE}?action=reserve`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  alert("予約が完了しました！");
  window.location.href = `thanks.html`;
}
