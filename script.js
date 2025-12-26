async function estimate() {
  const model = encodeURIComponent(document.getElementById("model").value);
  const repair_type = encodeURIComponent(document.getElementById("repair_type").value);
  const options = encodeURIComponent(document.getElementById("options").value);

  const url = `https://estimate-api-6j8x.onrender.com/estimate?model=${model}&repair_type=${repair_type}&options=${options}`;

  try {
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
      <p><strong>基本料金:</strong> ¥${data.base_price}</p>
    `;

    if (data.options.length > 0) {
      html += `<p><strong>オプション:</strong></p><ul>`;
      data.options.forEach(opt => {
        html += `<li>${opt.name}：¥${opt.price}</li>`;
      });
      html += `</ul>`;
    }

    html += `<p><strong>合計:</strong> <span style="font-size:1.2em;">¥${data.total}</span></p>`;

    document.getElementById("result").innerHTML = html;

  } catch (err) {
    document.getElementById("result").innerHTML = `<strong>通信エラー:</strong> ${err.message}`;
  }
}
