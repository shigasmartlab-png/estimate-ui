/* ============================================
   設定
============================================ */
const API_BASE = "https://script.google.com/macros/s/AKfycbzINOo8WOkYoqN8y7ku3mHmKcLvRkp_4AkA2gmRfAmgwRJy_bWIYyRZcf1aQmYPHAwl/exec";

const state = {
  selectedDates: [],   // [{date:"2025-01-20", time:"10:00"}, ...]
  customer: {},        // {name, lineName, address, count, identifier}
  currentUnit: 1,      // 今何台目を入力しているか
  menuSelections: [],  // [{menuType, delivery, detail:{}}, ...]
  reservationIds: []   // ["20250120-S1234-01", ...]
};

/* ============================================
   STEP切り替え
============================================ */
function showStep(id) {
  document.querySelectorAll(".step").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}

/* ============================================
   STEP1：カレンダー生成（簡易版）
============================================ */
function initCalendar() {
  flatpickr("#calendar_input", {
    dateFormat: "Y-m-d",
    minDate: "today",
    maxDate: new Date().fp_incr(30), // 30日先まで
    disable: [ "2026-01-21", "2026-01-25" ], // 予約済みの日付など
    locale: "ja",
    onChange: function(selectedDates, dateStr) {
      loadTimeSlots(dateStr); // 時間帯表示
    }
  });
}

async function loadTimeSlots(date) {
  const res = await fetch(`${API_BASE}?action=availability&date=${date}&duration=60`);
  const data = await res.json();

  const area = document.getElementById("time-slots");
  area.innerHTML = "";

  data.slots.forEach(s => {
    const btn = document.createElement("button");
    btn.textContent = s.time;
    btn.disabled = !s.available;
    btn.style.margin = "5px";

    btn.onclick = () => {
      state.selectedDates[state.currentUnit - 1] = {
        date: date,
        time: s.time
      };
      document.getElementById("step1-next").style.display = "block";
    };

    area.appendChild(btn);
  });
}

window.onload = () => { initCalendar(); };

/* ============================================
   STEP2：顧客情報
============================================ */
function generateIdentifier() {
  return "S" + Math.floor(1000 + Math.random() * 9000);
}

function saveCustomer() {
  const name = document.getElementById("customer_name").value.trim();
  const line = document.getElementById("customer_line").value.trim();
  const address = document.getElementById("customer_address").value.trim();
  const count = Number(document.getElementById("customer_count").value);

  if (!name || !line || !address || !count) {
    alert("すべての項目を入力してください");
    return;
  }

  state.customer = {
    name,
    lineName: line,
    address,
    count,
    identifier: generateIdentifier()
  };

  state.menuSelections = Array(count).fill(null).map(() => ({}));

  document.getElementById("unit-title").textContent = `1台目`;
  showStep("step3");
}

/* ============================================
   STEP3：メニュー選択
============================================ */
function saveMenu() {
  const menu = document.querySelector("input[name='menu_type']:checked");
  if (!menu) {
    alert("メニューを選択してください");
    return;
  }

  const delivery = document.getElementById("delivery_flag").checked;

  state.menuSelections[state.currentUnit - 1].menuType = menu.value;
  state.menuSelections[state.currentUnit - 1].delivery = delivery;

  switch (menu.value) {
    case "screen":
      enterStep4Screen();
      break;
    case "battery":
      enterStep4Battery();
      break;
    case "coating":
      enterStep4Coating();
      break;
    case "other":
      enterStep4Other();
      break;
    case "multi":
      enterStep4Multi();
      break;
  }
}

/* ============================================
   STEP4-A：画面修理
============================================ */
document.querySelectorAll("input[name='screen_os']").forEach(r => {
  r.addEventListener("change", () => {
    const other = document.getElementById("screen_os_other");
    other.style.display = r.value === "other" ? "inline-block" : "none";
  });
});

function enterStep4Screen() {
  document.getElementById("unit-title-screen").textContent = `${state.currentUnit}台目`;
  showStep("step4_screen");
}

function saveScreen() {
  const os = document.querySelector("input[name='screen_os']:checked");
  const q = document.querySelector("input[name='screen_quality']:checked");

  if (!os || !q) {
    alert("すべての項目を入力してください");
    return;
  }

  let osValue = os.value;
  if (osValue === "other") {
    osValue = document.getElementById("screen_os_other").value.trim();
    if (!osValue) {
      alert("その他の機種名を入力してください");
      return;
    }
  }

  state.menuSelections[state.currentUnit - 1].detail = {
    os: osValue,
    quality: q.value
  };

  goNextAfterStep4();
}

/* ============================================
   STEP4-B：バッテリー交換
============================================ */
document.querySelectorAll("input[name='battery_os']").forEach(r => {
  r.addEventListener("change", () => {
    const other = document.getElementById("battery_os_other");
    other.style.display = r.value === "other" ? "inline-block" : "none";
  });
});

function enterStep4Battery() {
  document.getElementById("unit-title-battery").textContent = `${state.currentUnit}台目`;
  showStep("step4_battery");
}

function saveBattery() {
  const os = document.querySelector("input[name='battery_os']:checked");
  const q = document.querySelector("input[name='battery_quality']:checked");

  if (!os || !q) {
    alert("すべての項目を入力してください");
    return;
  }

  let osValue = os.value;
  if (osValue === "other") {
    osValue = document.getElementById("battery_os_other").value.trim();
    if (!osValue) {
      alert("その他の機種名を入力してください");
      return;
    }
  }

  state.menuSelections[state.currentUnit - 1].detail = {
    os: osValue,
    quality: q.value
  };

  goNextAfterStep4();
}

/* ============================================
   STEP4-C：コーティング
============================================ */
document.querySelectorAll("input[name='coat_device']").forEach(r => {
  r.addEventListener("change", () => {
    const other = document.getElementById("coat_device_other");
    other.style.display = r.value === "other" ? "inline-block" : "none";
  });
});

document.getElementById("coat_count").addEventListener("input", () => {
  const count = Number(document.getElementById("coat_count").value);
  const area = document.getElementById("coat_options_area");
  area.innerHTML = "";

  if (!count || count < 1 || count > 99) return;

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${i}台目のコーティング種類</label>
      <select id="coat_type_${i}">
        <option value="screen">画面のみ</option>
        <option value="both">画面＋裏面</option>
      </select>
    `;
    area.appendChild(div);
  }
});

function enterStep4Coating() {
  document.getElementById("unit-title-coating").textContent = `${state.currentUnit}台目`;
  showStep("step4_coating");
}

function saveCoating() {
  const device = document.querySelector("input[name='coat_device']:checked");
  const count = Number(document.getElementById("coat_count").value);

  if (!device || !count) {
    alert("すべての項目を入力してください");
    return;
  }

  let deviceValue = device.value;
  if (deviceValue === "other") {
    deviceValue = document.getElementById("coat_device_other").value.trim();
    if (!deviceValue) {
      alert("その他の機器名を入力してください");
      return;
    }
  }

  const types = [];
  for (let i = 1; i <= count; i++) {
    types.push(document.getElementById(`coat_type_${i}`).value);
  }

  state.menuSelections[state.currentUnit - 1].detail = {
    device: deviceValue,
    count,
    types
  };

  goNextAfterStep4();
}

/* ============================================
   STEP4-D：その他修理
============================================ */
document.querySelectorAll("input[name='other_os']").forEach(r => {
  r.addEventListener("change", () => {
    const other = document.getElementById("other_os_other");
    other.style.display = r.value === "other" ? "inline-block" : "none";
  });
});

function enterStep4Other() {
  document.getElementById("unit-title-other").textContent = `${state.currentUnit}台目`;
  showStep("step4_other");
}

function saveOther() {
  const os = document.querySelector("input[name='other_os']:checked");
  const detail = document.getElementById("other_repair_detail").value.trim();

  if (!os || !detail) {
    alert("すべての項目を入力してください");
    return;
  }

  let osValue = os.value;
  if (osValue === "other") {
    osValue = document.getElementById("other_os_other").value.trim();
    if (!osValue) {
      alert("その他の機種名を入力してください");
      return;
    }
  }

  state.menuSelections[state.currentUnit - 1].detail = {
    os: osValue,
    repair: detail
  };

  goNextAfterStep4();
}

/* ============================================
   STEP4-E：複数組み合わせ
============================================ */
document.querySelectorAll("input[name='multi_menu']").forEach(c => {
  c.addEventListener("change", () => {
    const other = document.getElementById("multi_other_text");
    if (c.value === "other" && c.checked) {
      other.style.display = "inline-block";
    } else if (c.value === "other") {
      other.style.display = "none";
      other.value = "";
    }
  });
});

function enterStep4Multi() {
  document.getElementById("unit-title-multi").textContent = `${state.currentUnit}台目`;
  showStep("step4_multi");
}

function saveMultiMenu() {
  const checked = [...document.querySelectorAll("input[name='multi_menu']:checked")].map(c => c.value);

  if (checked.length === 0) {
    alert("1つ以上選択してください");
    return;
  }

  let otherText = "";
  if (checked.includes("other")) {
    otherText = document.getElementById("multi_other_text").value.trim();
    if (!otherText) {
      alert("その他の修理内容を入力してください");
      return;
    }
  }

  state.menuSelections[state.currentUnit - 1].detail = {
    selected: checked,
    otherText
  };

  enterStep5C();
}

/* ============================================
   STEP5-C：複数組み合わせ → 機種等入力
============================================ */
document.querySelectorAll("input[name='multi_os']").forEach(r => {
  r.addEventListener("change", () => {
    const other = document.getElementById("multi_os_other");
    other.style.display = r.value === "other" ? "inline-block" : "none";
  });
});

function enterStep5C() {
  document.getElementById("unit-title-step5c").textContent = `${state.currentUnit}台目`;

  const selected = state.menuSelections[state.currentUnit - 1].detail.selected;
  const area = document.getElementById("multi_dynamic_area");
  area.innerHTML = "";

  selected.forEach(type => {
    if (type === "screen") {
      area.innerHTML += `
        <div>
          <h3>画面修理</h3>
          <label><input type="radio" name="multi_screen_quality" value="LCD"> LCD</label>
          <label><input type="radio" name="multi_screen_quality" value="OLED"> OLED</label>
          <label><input type="radio" name="multi_screen_quality" value="refurb"> 再生品</label>
        </div>
      `;
    }

    if (type === "battery") {
      area.innerHTML += `
        <div>
          <h3>バッテリー交換</h3>
          <label><input type="radio" name="multi_battery_quality" value="standard"> 標準</label>
          <label><input type="radio" name="multi_battery_quality" value="large"> 大容量</label>
        </div>
      `;
    }

    if (type === "other") {
      area.innerHTML += `
        <div>
          <h3>その他修理</h3>
          <input type="text" id="multi_other_detail" placeholder="修理内容を入力">
        </div>
      `;
    }

    if (type === "coat_screen" || type === "coat_both") {
      area.innerHTML += `
        <div>
          <h3>ガラスコーティング</h3>
          <label>機器選択</label>
          <select id="multi_coat_device">
            <option value="smartphone">スマホ</option>
            <option value="tablet">タブレット</option>
            <option value="other">その他</option>
          </select>
          <input type="text" id="multi_coat_device_other" placeholder="機器名を入力" style="display:none;">
        </div>
      `;

      setTimeout(() => {
        const dev = document.getElementById("multi_coat_device");
        dev.addEventListener("change", () => {
          const other = document.getElementById("multi_coat_device_other");
          other.style.display = dev.value === "other" ? "inline-block" : "none";
        });
      }, 50);
    }
  });

  showStep("step5_c");
}

function saveStep5C() {
  const os = document.querySelector("input[name='multi_os']:checked");
  if (!os) {
    alert("機種を選択してください");
    return;
  }

  let osValue = os.value;
  if (osValue === "other") {
    osValue = document.getElementById("multi_os_other").value.trim();
    if (!osValue) {
      alert("その他の機種名を入力してください");
      return;
    }
  }

  const selected = state.menuSelections[state.currentUnit - 1].detail.selected;
  const detail = { os: osValue };

  if (selected.includes("screen")) {
    const q = document.querySelector("input[name='multi_screen_quality']:checked");
    if (!q) {
      alert("画面修理の品質を選択してください");
      return;
    }
    detail.screenQuality = q.value;
  }

  if (selected.includes("battery")) {
    const q = document.querySelector("input[name='multi_battery_quality']:checked");
    if (!q) {
      alert("バッテリー品質を選択してください");
      return;
    }
    detail.batteryQuality = q.value;
  }

  if (selected.includes("other")) {
    const t = document.getElementById("multi_other_detail").value.trim();
    if (!t) {
      alert("その他修理内容を入力してください");
      return;
    }
    detail.otherDetail = t;
  }

  if (selected.includes("coat_screen") || selected.includes("coat_both")) {
    const dev = document.getElementById("multi_coat_device").value;
    let devValue = dev;
    if (dev === "other") {
      devValue = document.getElementById("multi_coat_device_other").value.trim();
      if (!devValue) {
        alert("コーティングの機器名を入力してください");
        return;
      }
    }
    detail.coatDevice = devValue;
    detail.coatType = selected.includes("coat_both") ? "both" : "screen";
  }

  state.menuSelections[state.currentUnit - 1].detail = detail;

  showStep("step5_b");
}

/* ============================================
   STEP4 → STEP5-B or STEP5-C
============================================ */
function goNextAfterStep4() {
  const menu = state.menuSelections[state.currentUnit - 1].menuType;

  if (menu === "multi") {
    enterStep5C();
  } else {
    showStep("step5_b");
  }
}

/* ============================================
   STEP5-B：送信して次の台へ
============================================ */
function generateReservationId(date, identifier, unit) {
  const y = date.replace(/-/g, "");
  const u = ("0" + unit).slice(-2);
  return `${y}-${identifier}-${u}`;
}

async function sendAndNext() {
  const unit = state.currentUnit;
  const customer = state.customer;
  const menu = state.menuSelections[unit - 1];
  const dateInfo = state.selectedDates[unit - 1];

  // 予約ID生成
  const reservationId = generateReservationId(
    dateInfo.date,
    customer.identifier,
    unit
  );

  // GAS に送信するデータ
  const payload = {
    action: "reserve",
    reservation_id: reservationId,
    identifier: customer.identifier,
    unit: unit,
    date: dateInfo.date,
    time: dateInfo.time,
    name: customer.name,
    line_name: customer.lineName,
    address: customer.address,
    menu_type: menu.menuType,
    menu_detail: menu.detail,
    delivery: menu.delivery ? 1 : 0
  };

  // 送信
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!data.success) {
    alert("送信に失敗しました。通信環境をご確認ください。");
    return;
  }

  // 予約IDを保存
  state.reservationIds.push(reservationId);

  // 次の台へ
  if (unit < customer.count) {
    state.currentUnit++;
    document.getElementById("unit-title").textContent = `${state.currentUnit}台目`;
    showStep("step3");
  } else {
    // 全台終了 → 最終確認へ
    enterStep5A();
  }
}

/* ============================================
   STEP5-A：最終確認
============================================ */
function enterStep5A() {
  const area = document.getElementById("confirm_area");
  area.innerHTML = "";

  const customer = state.customer;

  // 顧客情報
  area.innerHTML += `
    <h3>お客様情報</h3>
    <p>名前：${customer.name}</p>
    <p>LINE表示名：${customer.lineName}</p>
    <p>住所：${customer.address}</p>
    <p>予約台数：${customer.count}台</p>
    <p>識別ID：${customer.identifier}</p>
    <hr>
  `;

  // 台数分の予約内容
  for (let i = 0; i < customer.count; i++) {
    const menu = state.menuSelections[i];
    const dateInfo = state.selectedDates[i];
    const rid = state.reservationIds[i] || "(未送信)";

    area.innerHTML += `
      <h3>${i + 1}台目</h3>
      <p>予約ID：${rid}</p>
      <p>作業日：${dateInfo.date}</p>
      <p>時間：${dateInfo.time}</p>
      <p>メニュー：${menu.menuType}</p>
      <p>出張対応：${menu.delivery ? "あり" : "なし"}</p>
      <p>詳細：${JSON.stringify(menu.detail)}</p>
      <hr>
    `;
  }

  showStep("step5_a");
}

/* ============================================
   STEP6：送信完了 → thanks.html へ
============================================ */
function finalSubmit() {
  const ids = state.reservationIds.join(",");
  location.href = `thanks.html?ids=${ids}`;
}

function goThanks() {
  const ids = state.reservationIds.join(",");
  location.href = `thanks.html?ids=${ids}`;
}

/* ============================================
   戻る処理
============================================ */
function backTo(step) {
  showStep(step);
}

/* ============================================
   初期化
============================================ */
window.onload = () => {
  initCalendar();
};
