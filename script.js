
// ======== ここだけ iPhone / Android で変える =========
// iPhone 用
const API_BASE = "https://estimate-api-6j8x.onrender.com";
// =====================================================

window.onload = async () => {
  await loadModels();
  await loadOptions();
};

async function loadModels() {
  try {
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
  } catch (err) {
    console.error("loadModels error:", err);
  }
}

async function loadRepairs() {
  const model = document.getElementById("model").value;

  try {
    const res = await fetch(`${API_BASE}/repairs?model=${encodeURIComponent(model)}`);
    const data = await res.json();

    const repairSelect = document.getElementById("repair_type");
    repairSelect.innerHTML = "";

    let availableCount = 0;

    data.repairs.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.name;

      if (r.status === "available") {
        opt.textContent = r.name;
        availableCount++;
      } else if (r.status === "soldout") {
        opt.textContent = `${r.name}（SOLD OUT）`;
        opt.disabled = true;
      } else if (r.status === "unsupported") {
        opt.textContent = `${r.name}（未対応）`;
        opt.disabled = true;
      }

      repairSelect.appendChild(opt);
    });

    repairSelect.disabled = availableCount === 0;
  } catch (err) {
    console.error("loadRepairs error:", err);
  }
}

async function loadOptions() {
  try {
    const res = await fetch(`${API_BASE}/options`);
    const data = await res.json();

    const area = document.getElementById("options-area");
    area.innerHTML = "";

    data.options.forEach(opt => {
      const div = document.createElement("div");
      div.className = "option-item";

      div.innerHTML = `
        <label>
          <input type="checkbox" value="${opt["オプション名"]}">
          <span>${opt["オプション名"]}（¥${opt["料金"].toLocaleString()}）</span>
        </label>
      `;

      area.appendChild(div);
    });
  } catch (err) {
    console.error("loadOptions error:", err);
  }
}

async function estimate() {
  const model = document.getElementById("model").value;
  const repair = document.getElementById("repair_type").value;

  const selectedOptions = [...document.querySelectorAll("#options-area input:checked")]
    .map(c => c.value)
    .join(",");

  const url = `${API_BASE}/estimate?model=${encodeURIComponent(model)}&repair_type=${encodeURIComponent(repair)}&options=${encodeURIComponent(selectedOptions)}`;

  const resultArea = document.getElementById("result");

  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error("JSONレスポンスではありません");
    }

    const data = await res.json();

    if (data.error) {
      if (data.error === "未対応") {
        resultArea.innerHTML = `
          <h2>見積もり結果</h2>
          <p>申し訳ございません。この修理は未対応です。</p>
        `;
        return;
      }

      if (data.error === "SOLD OUT") {
        resultArea.innerHTML = `
          <h2>見積もり結果</h2>
          <p>申し訳ございません。在庫切れ（SOLD OUT）のため対応できません。</p>
        `;
        return;
      }

      resultArea.innerHTML = `
        <h2>見積もり結果</h2>
        <p>申し訳ございません。エラーが発生しました。</p>
      `;
      console.warn("estimate error:", data.error);
      return;
    }

    let total = data.total;
    total = Math.ceil(total / 100) * 100;

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

    html += `<p><strong>合計:</strong> <span style="font-size:1.2em;">¥${total.toLocaleString()}</span></p>`;
    resultArea.innerHTML = html;

  } catch (err) {
    console.error("estimate error:", err);
    resultArea.innerHTML = `
      <h2>見積もり結果</h2>
      <p>申し訳ございません。システムエラーが発生しました。</p>
    `;
  }
}
