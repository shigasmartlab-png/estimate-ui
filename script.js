const API_BASE = "https://estimate-api-6j8x.onrender.com";

// ------------------------------
// 初期ロード
// ------------------------------
window.onload = async () => {
  await loadModels();
  await loadOptions();
};

// ------------------------------
// 機種プルダウン
// ------------------------------
async function loadModels() {
  const res = await fetch(`${API_BASE}/models`);
  const data = await res.json();

  const modelSelect = document.getElementById("model");
  modelSelect.innerHTML = "";

  data.models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  });

  modelSelect.addEventListener("change", loadRepairs);
  await loadRepairs();
}

// ------------------------------
// 故障内容プルダウン（機種依存）
// ------------------------------
async function loadRepairs() {
  const model = document.getElementById("model").value;

  const res = await fetch(`${API_BASE}/repairs?model=${encodeURIComponent(model)}`);
  const data = await res.json();

  const repairSelect = document.getElementById("repair_type");
  repairSelect.innerHTML = "";

  data.repairs.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    repairSelect.appendChild(opt);
  });
}

// ------------------------------
// オプションチェックボックス
// ------------------------------
async function loadOptions() {
  const res = await fetch(`${API_BASE}/options`);
  const data = await res.json();

  const area = document.getElementById("options-area");
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
}

// ------------------------------
// 見積もり API 呼び出し
// ------------------------------
async function estimate() {
  const model = document.getElementById("model").value;
  const repair = document.getElementById("repair_type").value;

  const selectedOptions = [...document.querySelectorAll("#options-area input:checked")]
    .map(c => c.value)
    .join(",");

  const url = `${API_BASE}/estimate?model=${encodeURIComponent(model)}&repair_type=${encodeURIComponent(repair)}&options=${encodeURIComponent(selectedOptions)}`;

  const res = await fetch(url);
  const data = await res.json();

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
}
