(() => {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_KEY;

  if (!url || !key) {
    console.error("Supabase config is missing.");
    return;
  }

  const names = ["Nitin", "Aradhana", "Mum", "Papa", "Rakhi", "Vivek"];

  const panel = document.createElement("section");
  panel.id = "global-diwali-tracker";
  panel.innerHTML = `
    <h2>🌍 DiwaliVerse — Global Activity</h2>
    <div class="tracker-total">🪔 <span id="global-total">Loading...</span></div>
    <p>Total diya taps from all visitors</p>
    <div id="tracker-diya-counts"></div>
    <p class="tracker-note">Counts update from the shared database.</p>
  `;

  Object.assign(panel.style, {
    maxWidth: "600px",
    margin: "30px auto",
    padding: "20px",
    textAlign: "center",
    color: "#fff",
    background: "rgba(30, 15, 45, .92)",
    border: "1px solid #f7a928",
    borderRadius: "18px",
    fontFamily: "sans-serif"
  });

  const style = document.createElement("style");
  style.textContent = `
    #global-diwali-tracker h2 { color: #ffc45c; margin-top: 0; }
    #global-diwali-tracker .tracker-total { font-size: 2rem; font-weight: bold; }
    #global-diwali-tracker p { opacity: .8; }
    #tracker-diya-counts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    #tracker-diya-counts div { background: rgba(255,255,255,.08); padding: 10px; border-radius: 10px; }
    #global-diwali-tracker .tracker-note { font-size: .8rem; }
  `;
  document.head.appendChild(style);

  document.body.appendChild(panel);

  const countEl = document.getElementById("global-total");
  const rowsEl = document.getElementById("tracker-diya-counts");

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  async function getCount(name) {
    let endpoint = `${url}/rest/v1/diwali_clicks?select=id`;

    if (name) {
      endpoint += `&diya_name=eq.${encodeURIComponent(name)}`;
    }

    const response = await fetch(endpoint, {
      method: "HEAD",
      headers: {
        ...headers,
        Prefer: "count=exact",
        Range: "0-0"
      }
    });

    if (!response.ok) {
      throw new Error(`Count request failed: ${response.status}`);
    }

    const range = response.headers.get("content-range") || "*/0";
    return Number(range.split("/").pop()) || 0;
  }

  async function refreshCounts() {
    try {
      const total = await getCount();
      countEl.textContent = total.toLocaleString();

      const counts = await Promise.all(names.map(getCount));
      rowsEl.innerHTML = names.map((name, index) => `
        <div>🪔 ${name}<br><strong>${counts[index].toLocaleString()} taps</strong></div>
      `).join("");
    } catch (error) {
      countEl.textContent = "Unavailable";
      console.error("DiwaliVerse tracker:", error);
    }
  }

  document.addEventListener("click", async (event) => {
    const diya = event.target.closest(".diya");
    if (!diya) return;

    const rect = diya.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX) / window.innerWidth) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY) / window.innerHeight) * 100));
    const diyaName = diya.querySelector("small")?.textContent?.trim() || "Other";

    try {
      const response = await fetch(`${url}/rest/v1/diwali_clicks`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          diya_name: diyaName,
          x_percent: Number(x.toFixed(2)),
          y_percent: Number(y.toFixed(2))
        })
      });

      if (!response.ok) {
        console.error("Could not save diya tap:", await response.text());
        return;
      }

      refreshCounts();
    } catch (error) {
      console.error("Could not save diya tap:", error);
    }
  });

  refreshCounts();
})();
