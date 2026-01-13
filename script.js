// ===============================
// 設定
// ===============================
const API_BASE = "https://android-estimate-api.onrender.com";


let formData = {};


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
// STEP2 → メニュー別画面
// ===============================
function selectMenu() {
  const menu = document.querySelector("input[name='menu']:checked");
  if (!menu) return alert("メニューを選択してください");

  formData.menu = menu.value;

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
// STEP3-D：複数組み合わせ
// ===============================
function saveMultiMenu() {
  const selected = [...document.querySelectorAll("input[name='multi_menu']:checked")]
    .map(cb => cb.value);

  if (selected.length === 0) return alert("1つ以上選択してください");

  formData.multi_menu = selected;

  showStep("step_multi_detail");
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
// STEP5：希望日入力
// ===============================
function saveDates() {
  formData.date1 = document.getElementById("date1").value;
  formData.time1 = document.getElementById("time1").value;

  formData.date2 = document.getElementById("date2").value;
  formData.time2 = document.getElementById("time2").value;

  formData.date3 = document.getElementById("date3").value;
  formData.time3 = document.getElementById("time3").value;

  if (!formData.date1 || !formData.time1 ||
      !formData.date2 || !formData.time2 ||
      !formData.date3 || !formData.time3) {
    alert("希望日をすべて入力してください");
    return;
  }

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

    <h3>希望日</h3>
    <p>第1希望：${formData.date1} ${formData.time1}</p>
    <p>第2希望：${formData.date2} ${formData.time2}</p>
    <p>第3希望：${formData.date3} ${formData.time3}</p>

    <h3>詳細情報（メモ）</h3>
    <pre>${JSON.stringify(formData, null, 2)}</pre>
  `;
}


// ===============================
// API送信
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
    window.location.href = "thanks.html";

  } catch (e) {
    alert("通信エラーが発生しました");
    console.error(e);
  }
}
