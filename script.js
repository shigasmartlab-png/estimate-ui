const API_BASE = "https://estimate-api-6j8x.onrender.com";

// ------------------------------
// 初期ロード
// ------------------------------
window.onload = async () => {
  console.log("📦 ページ読み込み開始");
  await loadModels();
  await loadOptions();
};

// ------------------------------
// 機種プルダウン
// ------------------------------
async function loadModels() {
  console.log("🔍 loadModels() 実行");

  try {
    const res = await fetch(`${API_BASE}/models`);
    const data = await res.json();
    console.log("✅ /models レスポンス:", data);

    const modelSelect = document.getElementById("model");
    if (!modelSelect) {
      console.error("❌ model セレクトボックスが見つかりません");
      return;
    }

    modelSelect.innerHTML = "";

    data.models.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });

    modelSelect.addEventListener("change", loadRepairs);
    await loadRepairs();

  } catch (err) {
    console.error("❌ loadModels() エラー:", err);
  }
}

// ------------------------------
// 故障内容プルダウン（機種依存）
// ------------------------------
async function loadRepairs() {
  const model = document.getElementById("model").value;
  console.log("🔍 loadRepairs() 実行 - 選択機種:", model);

  try {
    const res = await fetch(`${API_BASE}/repairs?model=${encodeURIComponent(model)}`);
    const data = await res.json();
    console.log("✅ /repairs レスポンス:", data);

    const repairSelect = document.getElementById("repair_type");
    if (!repairSelect) {
      console.error("❌ repair_type セレクトボックスが見つかりません");
      return;
    }

    repairSelect.innerHTML = "";

    data.repairs.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      repairSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("❌ loadRepairs() エラー:", err);
  }
}

// ------------------------------
// オプションチェックボックス
// ------------------------------
async function loadOptions() {
  console.log("🔍 loadOptions() 実行");

  try {
    const res = await fetch(`${API_BASE}/options`);
    const data = await res.json();
    console.log("✅ /options レスポンス:", data);

    const area = document.getElementById("options-area");
    if (!area) {
      console.error("❌ options-area が見つかりません");
      return;
    }

    area.innerHTML = "";

    data.options.forEach(opt => {
      const div = document.createElement("div");

      div.innerHTML = `
        <label>
          <input type="checkbox" value="${opt["オプション名"]}">
          ${opt["オプション名"]}（¥${opt["料金"].toLocaleString()}）
        </label>
      `;

      area.appendChild(div);
    });

  } catch (err) {
    console.error("❌ loadOptions() エラー:", err);
  }
}

// ------------------------------
// 見積もり API 呼び出し
// ------------------------------
async function estimate() {
  console.log("🚀 estimate() 実行");

  const model = document.getElementById("model").value;
  const repair = document.getElementById("repair_type").value;

  const selectedOptions = [...document.querySelectorAll("#options-area input:checked")]
    .map(c => c.value)
    .join(",");

  const url = `${API_BASE}/estimate?model=${encodeURIComponent(model)}&repair_type=${encodeURIComponent(repair)}&options=${encodeURIComponent(selectedOptions)}`;
  console.log("📡 API 呼び出しURL:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("✅ /estimate レスポンス:", data);

    if (data.error) {
      document.getElementById("result").innerHTML = `<strong>エラー:</strong> ${data.error}`;
      return;
    }

    let html = `
      <h2>見積もり結果</h2>
      <p><strong>機種:</strong> ${data.model}</p>
      <p><strong>故障内容:</strong> ${data.repair_type}</p>
      <p><strong>基本料金:</strong> ¥${data.base_price.toLocaleString()}</p>
    `;

    if (data.options.length > 0) {
      html += `<p><strong>オプション:</strong></p><ul>`;
      data.options.forEach(opt => {
        html += `<li>${opt.name}：¥${opt.price.toLocaleString()}</li>`;
      });
      html += `</ul>`;
    }

    html += `<p><strong>合計:</strong> <span style="font-size:1.2em;">¥${data.total.toLocaleString()}</span></p>`;

    document.getElementById("result").innerHTML = html;

  } catch (err) {
    console.error("❌ estimate() エラー:", err);
    document.getElementById("result").innerHTML = `<strong>通信エラー:</strong> ${err.message}`;
  }
}
