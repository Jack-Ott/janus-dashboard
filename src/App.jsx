import { useState, useCallback, useEffect } from "react";

// ─── Shared Utilities ────────────────────────────────────────────────────────

const fmt = (n) => "£" + Math.round(n).toLocaleString("en-GB");
const fmtPct = (n) => (isFinite(n) ? n.toFixed(1) : "0.0") + "%";
const fmtX = (n) => (isFinite(n) ? n.toFixed(2) : "0.00") + "x";
const safe = (n, d = 0) => (isFinite(n) && !isNaN(n) ? n : d);

// ─── Shared Components ───────────────────────────────────────────────────────

const InputField = ({ label, value, onChange, prefix, suffix, step = "1", readOnly = false }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{ display: "block", fontSize: "10px", color: readOnly ? "#444" : "#555", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "5px" }}>
      {label}{readOnly && <span style={{ color: "#2a6a4a", marginLeft: "6px" }}>auto</span>}
    </label>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && <span style={{ position: "absolute", left: "10px", color: "#555", fontFamily: "monospace", fontSize: "13px" }}>{prefix}</span>}
      <input type="number" value={value} step={step} readOnly={readOnly}
        onChange={(e) => { if (!readOnly) { const v = e.target.value; onChange(v === "" ? "" : parseFloat(v) || 0); } }}
        onBlur={(e) => { if (!readOnly && e.target.value === "") onChange(0); }}
        style={{ width: "100%", background: readOnly ? "#0d0d0d" : "#111", border: `1px solid ${readOnly ? "#1a1a1a" : "#222"}`, borderRadius: "4px", color: readOnly ? "#555" : "#e0e0e0", fontFamily: "monospace", fontSize: "13px", padding: prefix ? "7px 10px 7px 22px" : suffix ? "7px 30px 7px 10px" : "7px 10px", outline: "none", boxSizing: "border-box", cursor: readOnly ? "default" : "text" }}
      />
      {suffix && <span style={{ position: "absolute", right: "10px", color: "#555", fontFamily: "monospace", fontSize: "13px" }}>{suffix}</span>}
    </div>
  </div>
);

const SectionLabel = ({ title }) => (
  <div style={{ fontSize: "10px", color: "#00e5a0", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px", marginTop: "20px", borderLeft: "2px solid #00e5a0", paddingLeft: "8px" }}>
    {title}
  </div>
);

const ResultRow = ({ label, current, projected, highlight, neutral }) => {
  const isStr = typeof current === "string";
  const improved = !isStr && projected > current;
  const pct = !isStr && current !== 0 ? ((projected - current) / Math.abs(current)) * 100 : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #161616", gap: "8px" }}>
      <span style={{ color: "#666", fontSize: "12px", fontFamily: "monospace" }}>{label}</span>
      <span style={{ color: "#aaa", fontSize: "13px", fontFamily: "monospace", textAlign: "right" }}>{isStr ? current : fmt(current)}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ color: highlight ? "#00e5a0" : neutral ? "#aaa" : improved ? "#00e5a0" : "#aaa", fontSize: highlight ? "15px" : "13px", fontFamily: "monospace", fontWeight: highlight ? "700" : "400" }}>
          {isStr ? projected : fmt(projected)}
        </span>
        {!isStr && !neutral && pct !== 0 && (
          <span style={{ display: "block", fontSize: "10px", color: improved ? "#00a870" : "#888", fontFamily: "monospace" }}>
            {improved ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

const ColHeaders = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "4px", gap: "8px" }}>
    <span style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Metric</span>
    <span style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>Current</span>
    <span style={{ fontSize: "9px", color: "#00e5a0", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>Projected</span>
  </div>
);

const Callout = ({ items }) => (
  <div style={{ background: "#0f1f1a", border: "1px solid #00e5a0", borderRadius: "6px", padding: "16px", marginTop: "16px" }}>
    <div style={{ fontSize: "10px", color: "#00a870", marginBottom: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Transformation Summary</div>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: "12px" }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "20px", color: "#00e5a0", fontWeight: "700" }}>{value}</div>
          <div style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        </div>
      ))}
    </div>
  </div>
);

const TwoCol = ({ left, right }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>
    <div style={{ padding: "20px", borderRight: "1px solid #1a1a1a", overflowY: "auto" }}>{left}</div>
    <div style={{ padding: "20px", overflowY: "auto" }}>{right}</div>
  </div>
);

// ─── Profit Tab Helpers ───────────────────────────────────────────────────────

const CHANNEL_OPTIONS = ["Meta", "Google", "TikTok", "YouTube", "Email", "Organic", "Other"];
const cardStyle = { background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "12px", marginBottom: "10px" };

const ni = (value, onChange, { prefix, suffix, readOnly = false } = {}) => (
  <div style={{ position: "relative" }}>
    {prefix && <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#555", fontFamily: "monospace", fontSize: "12px", zIndex: 1 }}>{prefix}</span>}
    <input type="number" value={value} readOnly={readOnly}
      onChange={(e) => { if (!readOnly) { const v = e.target.value; onChange(v === "" ? "" : parseFloat(v) || 0); } }}
      onBlur={(e) => { if (!readOnly && e.target.value === "") onChange(0); }}
      style={{ width: "100%", background: readOnly ? "#0d0d0d" : "#0a0a0a", border: `1px solid ${readOnly ? "#1a1a1a" : "#222"}`, borderRadius: "4px", color: readOnly ? "#444" : "#e0e0e0", fontFamily: "monospace", fontSize: "12px", padding: prefix ? "5px 6px 5px 18px" : suffix ? "5px 22px 5px 6px" : "5px 6px", outline: "none", boxSizing: "border-box", cursor: readOnly ? "default" : "text" }}
    />
    {suffix && <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#555", fontFamily: "monospace", fontSize: "12px" }}>{suffix}</span>}
  </div>
);

const ml = (t, auto = false) => (
  <label style={{ display: "block", fontSize: "9px", color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
    {t}{auto && <span style={{ color: "#2a6a4a", marginLeft: "4px" }}>calc</span>}
  </label>
);
const ti = (v, onChange, ph) => <input type="text" value={v} onChange={(e) => onChange(e.target.value)} placeholder={ph} style={{ width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: "4px", color: "#e0e0e0", fontFamily: "monospace", fontSize: "12px", padding: "5px 8px", outline: "none", boxSizing: "border-box" }} />;
const cardHeader = (label, onRemove, canRemove) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
    <span style={{ fontSize: "10px", color: "#00e5a0", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
    {canRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>}
  </div>
);
const cardFooter = (top, bottom) => (
  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1a1a1a" }}>
    <div style={{ fontSize: "9px", color: "#555", fontFamily: "monospace", marginBottom: "2px" }}>{top}</div>
    <div style={{ fontSize: "11px", color: "#00e5a0", fontFamily: "monospace", fontWeight: "600" }}>{bottom}</div>
  </div>
);
const addBtn = (onClick, label) => (
  <button onClick={onClick} style={{ width: "100%", background: "none", border: "1px dashed #2a2a2a", borderRadius: "6px", color: "#444", fontFamily: "monospace", fontSize: "11px", padding: "8px", cursor: "pointer", marginBottom: "4px" }}>
    {label}
  </button>
);
const selectStyle = { width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: "4px", color: "#e0e0e0", fontFamily: "monospace", fontSize: "12px", padding: "5px 6px", outline: "none" };

// ─── Revenue Mismatch Modal ───────────────────────────────────────────────────

function MismatchModal({ productRevenue, attributedRevenue, onKeep, onOverride }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "28px", maxWidth: "420px", width: "90%" }}>
        <div style={{ fontSize: "13px", color: "#ff9f40", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
          Revenue Mismatch Detected
        </div>
        <div style={{ fontSize: "12px", color: "#888", fontFamily: "monospace", lineHeight: "1.7", marginBottom: "24px" }}>
          The Product section calculates total revenue of <span style={{ color: "#e0e0e0" }}>{fmt(productRevenue)}</span>.<br /><br />
          The combined attributed revenue from your marketing channels is <span style={{ color: "#e0e0e0" }}>{fmt(attributedRevenue)}</span>.<br /><br />
          Which value would you like to use for your business calculations?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button onClick={onKeep} style={{ background: "none", border: "1px solid #333", borderRadius: "4px", color: "#aaa", fontFamily: "monospace", fontSize: "11px", padding: "10px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Keep Product Revenue
          </button>
          <button onClick={onOverride} style={{ background: "#00e5a0", border: "none", borderRadius: "4px", color: "#000", fontFamily: "monospace", fontSize: "11px", padding: "10px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>
            Override with Attributed
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Centralised Business Calculations ───────────────────────────────────────

function calcBusinessTotals({ products, channels, adminCosts, useAttributedRevenue }) {
  const totalProdUnits = products.reduce((s, p) => s + p.units, 0);
  const totalProdRevenue = products.reduce((s, p) => s + p.price * p.units, 0);
  const productAov = totalProdUnits > 0 ? totalProdRevenue / totalProdUnits : 0;
  const blendedCogs = totalProdUnits > 0 ? products.reduce((s, p) => s + p.cogs * p.units, 0) / totalProdUnits : 0;

  const channelData = channels.map((c) => {
    const orders = productAov > 0 ? c.attributedRevenue / productAov : 0;
    const cac = orders > 0 ? c.spend / orders : 0;
    return { ...c, orders: Math.round(orders), cac: safe(cac) };
  });

  const totalAttributedRevenue = channels.reduce((s, c) => s + c.attributedRevenue, 0);
  const totalPaidSpend = channels.reduce((s, c) => s + c.spend, 0);
  const totalPaidOrders = channelData.filter((c) => c.spend > 0).reduce((s, c) => s + c.orders, 0);

  const activeRevenue = useAttributedRevenue ? totalAttributedRevenue : totalProdRevenue;
  const activeOrders = productAov > 0 ? activeRevenue / productAov : 0;
  const activeCogs = activeOrders * blendedCogs;
  const activeGP = activeRevenue - activeCogs;
  const profitAfterMktg = activeGP - totalPaidSpend;
  const netProfit = profitAfterMktg - adminCosts;
  const netMargin = activeRevenue > 0 ? (netProfit / activeRevenue) * 100 : 0;
  const activeAov = safe(activeOrders > 0 ? activeRevenue / activeOrders : productAov, productAov);
  const blendedCac = totalPaidOrders > 0 ? totalPaidSpend / totalPaidOrders : 0;

  return {
    productAov, blendedCogs, channelData,
    totalProdRevenue, totalAttributedRevenue, totalPaidSpend, totalPaidOrders,
    activeRevenue, activeOrders, activeCogs, activeGP,
    profitAfterMktg, netProfit, netMargin, activeAov, blendedCac,
    gpPerOrder: productAov - blendedCogs,
  };
}

// ─── Tab: Profit ─────────────────────────────────────────────────────────────

function ProfitTab({ onDataChange }) {
  const [products, setProducts] = useState([
    { id: 1, name: "Product 1", price: 100, cogs: 25, units: 100 },
  ]);
  const [channels, setChannels] = useState([
    { id: 1, name: "Meta", spend: 2000, attributedRevenue: 5800 },
    { id: 2, name: "Google", spend: 800, attributedRevenue: 4000 },
    { id: 3, name: "Organic", spend: 0, attributedRevenue: 200 },
  ]);
  const [adminCosts, setAdminCosts] = useState(1000);
  const [repeatRate, setRepeatRate] = useState(28);
  const [subCapture, setSubCapture] = useState(40);
  const [subDiscount, setSubDiscount] = useState(10);
  const [projProducts, setProjProducts] = useState([
    { id: 1, srcId: 1, useUplift: true, uplift: 55, price: "", units: 85 },
  ]);
  const [projChannels, setProjChannels] = useState([
    { id: 1, srcId: 1, spend: 4000, cacOverride: null },
    { id: 2, srcId: 2, spend: 1600, cacOverride: null },
    { id: 3, srcId: 3, spend: 0, cacOverride: null },
  ]);
  const [modal, setModal] = useState(null); // { productRevenue, attributedRevenue }
  const [useAttributedRevenue, setUseAttributedRevenue] = useState(false);

  // ── Core calculations ──
  const biz = calcBusinessTotals({ products, channels, adminCosts, useAttributedRevenue });

  // ── Validation check (on blur) ──
  const checkMismatch = useCallback(() => {
    const mismatch = Math.abs(biz.totalProdRevenue - biz.totalAttributedRevenue) > 1;
    if (mismatch) {
      setUseAttributedRevenue(false); // reset override on any input change
      setModal({ productRevenue: biz.totalProdRevenue, attributedRevenue: biz.totalAttributedRevenue });
    } else {
      setModal(null);
    }
  }, [biz.totalProdRevenue, biz.totalAttributedRevenue]);

  // Notify parent for LTV/CAC tab sync
  useEffect(() => {
    if (onDataChange) onDataChange({ ...biz, products });
  });

  // ── Projected calculations ──
  const resolvedPP = projProducts.map((pp) => {
    const src = products.find((p) => p.id === pp.srcId);
    if (!src) return { ...pp, resolvedPrice: 0, resolvedUnits: 0, cogs: 0 };
    const raw = pp.useUplift || !pp.price ? src.price * (1 + parseFloat(pp.uplift || 0) / 100) : parseFloat(pp.price) || src.price;
    return { ...pp, resolvedPrice: Math.round(raw * 100) / 100, resolvedUnits: Math.round(parseFloat(pp.units) || 0), cogs: src.cogs };
  });

  const totalProjUnits = resolvedPP.reduce((s, p) => s + p.resolvedUnits, 0);
  const totalProjProdRev = resolvedPP.reduce((s, p) => s + p.resolvedPrice * p.resolvedUnits, 0);
  const projProductAov = totalProjUnits > 0 ? totalProjProdRev / totalProjUnits : biz.productAov;
  const projBlendedCogs = totalProjUnits > 0 ? resolvedPP.reduce((s, p) => s + p.cogs * p.resolvedUnits, 0) / totalProjUnits : biz.blendedCogs;

  const projChannelData = projChannels.map((pc) => {
    const src = biz.channelData.find((c) => c.id === pc.srcId);
    if (!src) return { ...pc, orders: 0, revenue: 0, cac: 0, name: "" };
    const isOrganic = src.spend === 0;
    const effectiveCac = pc.cacOverride !== null ? pc.cacOverride : src.cac;
    // Use same AOV logic as current: attributed revenue / product AOV = orders
    // Projected: spend / CAC = orders, orders x projProductAov = revenue
    const orders = isOrganic ? src.orders : safe(effectiveCac > 0 ? Math.round(pc.spend / effectiveCac) : 0);
    const revenue = isOrganic ? src.attributedRevenue : orders * projProductAov;
    return { ...pc, orders, revenue, cac: effectiveCac, name: src.name, isOrganic };
  });

  const totalProjOrders = projChannelData.reduce((s, c) => s + c.orders, 0);
  const totalProjRevenue = projChannelData.reduce((s, c) => s + c.revenue, 0);
  const totalProjCogs = totalProjOrders * projBlendedCogs;
  const totalProjGP = totalProjRevenue - totalProjCogs;
  const totalProjAdSpend = projChannels.reduce((s, c) => s + c.spend, 0);
  const projProfitAfterMktg = totalProjGP - totalProjAdSpend;
  const subRevenue = biz.activeOrders * (repeatRate / 100) * (subCapture / 100) * projProductAov * (1 - subDiscount / 100);
  const subCogs = projProductAov > 0 ? (subRevenue / projProductAov) * projBlendedCogs : 0;
  const projNetProfit = projProfitAfterMktg + subRevenue - subCogs - adminCosts;
  const projTotalRevenue = totalProjRevenue + subRevenue;
  const projNetMargin = projTotalRevenue > 0 ? (projNetProfit / projTotalRevenue) * 100 : 0;
  const projAov = totalProjOrders > 0 ? totalProjRevenue / totalProjOrders : projProductAov;
  const revenueUplift = biz.activeRevenue > 0 ? Math.round(((projTotalRevenue - biz.activeRevenue) / biz.activeRevenue) * 100) : 0;
  const profitUplift = biz.netProfit !== 0 ? Math.round(((projNetProfit - biz.netProfit) / Math.abs(biz.netProfit)) * 100) : 0;

  // ── Helpers ──
  const addProduct = () => {
    const id = Date.now();
    setProducts((p) => [...p, { id, name: "", price: 0, cogs: 0, units: 0 }]);
    setProjProducts((p) => [...p, { id: id + 1, srcId: id, useUplift: true, uplift: 55, price: "", units: 0 }]);
  };
  const removeProduct = (id) => {
    if (products.length <= 1) return;
    setProducts((p) => p.filter((x) => x.id !== id));
    setProjProducts((p) => p.filter((x) => x.srcId !== id));
  };
  const upProd = (id, f, v) => setProducts((p) => p.map((x) => x.id === id ? { ...x, [f]: v } : x));
  const upProjProd = (srcId, f, v) => setProjProducts((pp) => pp.map((p) => {
    if (p.srcId !== srcId) return p;
    const src = products.find((x) => x.id === srcId);
    if (f === "useUplift") return { ...p, useUplift: v, price: "", uplift: v ? 55 : 0 };
    if (f === "uplift") return { ...p, uplift: v };
    if (f === "price") return { ...p, price: v, uplift: src && parseFloat(v) > 0 ? (((parseFloat(v) - src.price) / src.price) * 100).toFixed(1) : p.uplift };
    return { ...p, [f]: v };
  }));
  const addChannel = () => {
    const id = Date.now();
    setChannels((c) => [...c, { id, name: "Meta", spend: 0, attributedRevenue: 0 }]);
    setProjChannels((c) => [...c, { id: id + 1, srcId: id, spend: 0, cacOverride: null }]);
  };
  const removeChannel = (id) => {
    if (channels.length <= 1) return;
    setChannels((c) => c.filter((x) => x.id !== id));
    setProjChannels((c) => c.filter((x) => x.srcId !== id));
  };
  const upChan = (id, f, v) => setChannels((c) => c.map((x) => x.id === id ? { ...x, [f]: v } : x));
  const upProjChan = (srcId, f, v) => setProjChannels((c) => c.map((x) => x.srcId === srcId ? { ...x, [f]: v } : x));

  return (
    <>
      {modal && (
        <MismatchModal
          productRevenue={modal.productRevenue}
          attributedRevenue={modal.attributedRevenue}
          onKeep={() => { setUseAttributedRevenue(false); setModal(null); }}
          onOverride={() => { setUseAttributedRevenue(true); setModal(null); }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT ── */}
        <div style={{ padding: "20px", borderRight: "1px solid #1a1a1a", overflowY: "auto" }}>

          {/* Revenue source indicator */}
          {useAttributedRevenue && (
            <div style={{ background: "#0a1a10", border: "1px solid #00a870", borderRadius: "4px", padding: "8px 12px", marginBottom: "12px", fontSize: "10px", color: "#00a870", fontFamily: "monospace" }}>
              Using attributed revenue as source of truth
            </div>
          )}

          <SectionLabel title="Current Products" />
          {products.map((p, i) => (
            <div key={p.id} style={cardStyle}>
              {cardHeader(`Product ${i + 1}`, () => removeProduct(p.id), products.length > 1)}
              <div style={{ marginBottom: "6px" }}>{ml("Name")}{ti(p.name, (v) => upProd(p.id, "name", v), "e.g. Watch Case")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                <div>{ml("Price (AOV)")}{ni(p.price, (v) => upProd(p.id, "price", v), { prefix: "£" })}</div>
                <div>{ml("COGS/unit")}{ni(p.cogs, (v) => upProd(p.id, "cogs", v), { prefix: "£" })}</div>
                <div>{ml("Units Sold")}{ni(p.units, (v) => upProd(p.id, "units", v), {})}</div>
              </div>
              {cardFooter(
                `Revenue: ${fmt(p.price * p.units)} · GP/unit: ${fmt(p.price - p.cogs)}`,
                `Gross Profit: ${fmt((p.price - p.cogs) * p.units)} (${p.price > 0 ? Math.round(((p.price - p.cogs) / p.price) * 100) : 0}%)`
              )}
            </div>
          ))}
          {addBtn(addProduct, "+ Add Product")}

          <SectionLabel title="Current Marketing" />
          {biz.channelData.map((c, i) => (
            <div key={c.id} style={cardStyle} onBlur={checkMismatch}>
              {cardHeader(`Channel ${i + 1}`, () => removeChannel(c.id), channels.length > 1)}
              <div style={{ marginBottom: "6px" }}>
                {ml("Channel")}
                <select value={c.name} onChange={(e) => upChan(c.id, "name", e.target.value)} style={selectStyle}>
                  {CHANNEL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div>{ml("Ad Spend")}{ni(c.spend, (v) => upChan(c.id, "spend", v), { prefix: "£" })}</div>
                <div>{ml("Attributed Revenue")}{ni(c.attributedRevenue, (v) => upChan(c.id, "attributedRevenue", v), { prefix: "£" })}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
                <div>{ml("Orders", true)}{ni(c.orders, null, { readOnly: true })}</div>
                <div>{ml("CAC", true)}{ni(c.cac, null, { prefix: "£", readOnly: true })}</div>
              </div>
              {cardFooter(
                `AOV: ${fmt(biz.productAov)}`,
                `Net Contrib: ${fmt(c.attributedRevenue - c.orders * biz.blendedCogs - c.spend)}`
              )}
            </div>
          ))}
          {addBtn(addChannel, "+ Add Channel")}

          <SectionLabel title="Fixed Costs" />
          <InputField label="Admin & Staff Costs" value={adminCosts} onChange={setAdminCosts} prefix="£" />
          <InputField label="Repeat Purchase Rate" value={repeatRate} onChange={setRepeatRate} suffix="%" />
          <InputField label="Subscription Capture %" value={subCapture} onChange={setSubCapture} suffix="%" />
          <InputField label="Subscription Discount %" value={subDiscount} onChange={setSubDiscount} suffix="%" />

          <SectionLabel title="Projected Products" />
          {resolvedPP.map((pp, i) => {
            const src = products.find((p) => p.id === pp.srcId);
            return (
              <div key={pp.id} style={cardStyle}>
                {cardHeader(src ? (src.name || `Product ${i + 1}`) : `Product ${i + 1}`, null, false)}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  <div>
                    {ml("Price Mode")}
                    <select value={pp.useUplift ? "uplift" : "fixed"} onChange={(e) => upProjProd(pp.srcId, "useUplift", e.target.value === "uplift")} style={selectStyle}>
                      <option value="uplift">% Uplift</option>
                      <option value="fixed">£ Fixed</option>
                    </select>
                  </div>
                  <div>
                    {ml(pp.useUplift ? "Uplift %" : "Fixed Price")}
                    {pp.useUplift ? ni(pp.uplift, (v) => upProjProd(pp.srcId, "uplift", v), { suffix: "%" }) : ni(pp.price, (v) => upProjProd(pp.srcId, "price", v), { prefix: "£" })}
                  </div>
                  <div>{ml("Proj Units")}{ni(pp.resolvedUnits, (v) => upProjProd(pp.srcId, "units", v), {})}</div>
                </div>
                {cardFooter(
                  `Curr: ${fmt(src ? src.price : 0)} → Proj: ${fmt(pp.resolvedPrice)}`,
                  `Gross Profit: ${fmt((pp.resolvedPrice - (src ? src.cogs : 0)) * pp.resolvedUnits)}`
                )}
              </div>
            );
          })}

          <SectionLabel title="Projected Marketing" />
          {projChannelData.map((pc, i) => (
            <div key={pc.id} style={cardStyle}>
              {cardHeader(pc.name || `Channel ${i + 1}`, null, false)}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div>
                  {ml("Proj Ad Spend")}
                  {pc.isOrganic
                    ? <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#444", padding: "5px 0" }}>Organic — unchanged</div>
                    : ni(pc.spend, (v) => upProjChan(pc.srcId, "spend", v), { prefix: "£" })}
                </div>
                <div>
                  {ml("CAC (override or inherited)")}
                  {ni(
                    pc.cacOverride !== null ? pc.cacOverride : pc.cac,
                    (v) => upProjChan(pc.srcId, "cacOverride", v),
                    { prefix: "£" }
                  )}
                </div>
              </div>
              {cardFooter(
                `Proj orders: ${pc.orders} · Proj AOV: ${fmt(projProductAov)}`,
                `Proj revenue: ${fmt(pc.revenue)}`
              )}
            </div>
          ))}
        </div>

        {/* ── RIGHT ── */}
        <div style={{ padding: "20px", overflowY: "auto" }}>

          {/* Hero numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "Net Profit", curr: fmt(biz.netProfit), proj: fmt(projNetProfit), up: projNetProfit > biz.netProfit },
              { label: "Revenue", curr: fmt(biz.activeRevenue), proj: fmt(projTotalRevenue), up: projTotalRevenue > biz.activeRevenue },
              { label: "Net Margin", curr: fmtPct(biz.netMargin), proj: fmtPct(projNetMargin), up: projNetMargin > biz.netMargin },
            ].map(({ label, curr, proj, up }) => (
              <div key={label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "14px" }}>
                <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", marginBottom: "4px" }}>{curr}</div>
                <div style={{ fontSize: "18px", color: up ? "#00e5a0" : "#aaa", fontFamily: "monospace", fontWeight: "700" }}>{proj}</div>
                <div style={{ fontSize: "9px", color: up ? "#00a870" : "#555", fontFamily: "monospace", marginTop: "4px" }}>projected</div>
              </div>
            ))}
          </div>

          {/* Channel performance */}
          <SectionLabel title="Channel Performance" />
          {biz.channelData.map((c) => {
            const pc = projChannelData.find((x) => x.srcId === c.id);
            const netContrib = c.attributedRevenue - c.orders * biz.blendedCogs - c.spend;
            const projNetContrib = pc ? pc.revenue - pc.orders * projBlendedCogs - pc.spend : 0;
            return (
              <div key={c.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "14px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#00e5a0", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.name}</span>
                  {c.cac > 0 && <span style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>CAC {fmt(c.cac)}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Orders", curr: c.orders, proj: pc ? pc.orders : 0 },
                    { label: "Revenue", curr: c.attributedRevenue, proj: pc ? pc.revenue : 0, money: true },
                    { label: "Net Contrib", curr: netContrib, proj: projNetContrib, money: true },
                  ].map(({ label, curr, proj, money }) => (
                    <div key={label}>
                      <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{money ? fmt(curr) : curr}</div>
                      <div style={{ fontSize: "12px", color: proj > curr ? "#00e5a0" : "#aaa", fontFamily: "monospace", fontWeight: "600" }}>{money ? fmt(proj) : proj}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* P&L waterfall */}
          <SectionLabel title="P&L Waterfall" />
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "14px" }}>
            {[
              { label: "Revenue", curr: biz.activeRevenue, proj: projTotalRevenue, type: "revenue" },
              { label: "COGS", curr: -biz.activeCogs, proj: -totalProjCogs, type: "cost" },
              { label: "Gross Profit", curr: biz.activeGP, proj: totalProjGP, type: "subtotal" },
              { label: "Ad Spend", curr: -biz.totalPaidSpend, proj: -totalProjAdSpend, type: "cost" },
              { label: "Subscription Rev", curr: 0, proj: subRevenue, type: "revenue" },
              { label: "Admin & Staff", curr: -adminCosts, proj: -adminCosts, type: "cost" },
              { label: "Net Profit", curr: biz.netProfit, proj: projNetProfit, type: "total" },
            ].map(({ label, curr, proj, type }, idx) => {
              const isTotal = type === "total" || type === "subtotal";
              const isCost = type === "cost";
              return (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", padding: "8px 0", borderTop: idx > 0 ? `1px solid ${isTotal ? "#2a2a2a" : "#161616"}` : "none", marginTop: isTotal ? "4px" : "0" }}>
                  <span style={{ fontSize: "11px", color: isTotal ? "#aaa" : "#555", fontFamily: "monospace", fontWeight: isTotal ? "600" : "400" }}>{label}</span>
                  <span style={{ fontSize: "11px", color: isCost ? "#555" : curr < 0 ? "#ff5f5f" : "#666", fontFamily: "monospace", textAlign: "right" }}>
                    {curr < 0 ? `(${fmt(Math.abs(curr))})` : fmt(curr)}
                  </span>
                  <span style={{ fontSize: isTotal ? "13px" : "11px", color: type === "total" ? "#00e5a0" : isCost ? "#555" : proj > curr ? "#00a870" : "#aaa", fontFamily: "monospace", textAlign: "right", fontWeight: isTotal ? "700" : "400" }}>
                    {proj < 0 ? `(${fmt(Math.abs(proj))})` : fmt(proj)}
                  </span>
                </div>
              );
            })}
          </div>

          <Callout items={[
            { label: "Revenue", value: "+" + revenueUplift + "%" },
            { label: "Profit", value: "+" + profitUplift + "%" },
            { label: "Margin", value: "+" + (projNetMargin - biz.netMargin).toFixed(1) + "pp" },
          ]} />
        </div>
      </div>
    </>
  );
}

// ─── Tab: Pricing ────────────────────────────────────────────────────────────

function PricingTab() {
  const [units, setUnits] = useState(368);
  const [cogs, setCogs] = useState(16);
  const [currentPrice, setCurrentPrice] = useState(38);
  const [uplift, setUplift] = useState(25);
  const [elasticity, setElasticity] = useState(10);

  const projPrice = currentPrice * (1 + uplift / 100);
  const projUnits = units * (1 - elasticity / 100);
  const currentRevenue = units * currentPrice;
  const projRevenue = projUnits * projPrice;
  const currentGross = currentRevenue - units * cogs;
  const projGross = projRevenue - projUnits * cogs;
  const currentMargin = currentRevenue > 0 ? (currentGross / currentRevenue) * 100 : 0;
  const projMargin = projRevenue > 0 ? (projGross / projRevenue) * 100 : 0;

  return (
    <TwoCol
      left={
        <>
          <SectionLabel title="Product" />
          <InputField label="Monthly Units Sold" value={units} onChange={setUnits} />
          <InputField label="Cost Per Unit (COGS)" value={cogs} onChange={setCogs} prefix="£" step="0.5" />
          <InputField label="Current Price" value={currentPrice} onChange={setCurrentPrice} prefix="£" step="0.5" />
          <SectionLabel title="Pricing Levers" />
          <InputField label="Price Uplift %" value={uplift} onChange={setUplift} suffix="%" step="0.5" />
          <InputField label="Expected Volume Drop %" value={elasticity} onChange={setElasticity} suffix="%" step="0.5" />
        </>
      }
      right={
        <>
          <SectionLabel title="Results" />
          <ColHeaders />
          <ResultRow label="Price" current={currentPrice} projected={projPrice} />
          <ResultRow label="Units Sold" current={units} projected={Math.round(projUnits)} />
          <ResultRow label="Revenue" current={currentRevenue} projected={projRevenue} />
          <ResultRow label="Gross Profit" current={currentGross} projected={projGross} highlight />
          <ResultRow label="Gross Margin" current={fmtPct(currentMargin)} projected={fmtPct(projMargin)} highlight />
          <Callout items={[
            { label: "Price", value: "+" + uplift + "%" },
            { label: "Gross Profit", value: currentGross > 0 ? "+" + Math.round(((projGross - currentGross) / currentGross) * 100) + "%" : "—" },
            { label: "Margin", value: "+" + (projMargin - currentMargin).toFixed(1) + "pp" },
          ]} />
        </>
      }
    />
  );
}

// ─── Tab: LTV & CAC ──────────────────────────────────────────────────────────

function LTVCACTab({ dashboardData }) {
  const [mode, setMode] = useState("dashboard"); // "dashboard" | "manual"
  const [manualAov, setManualAov] = useState(100);
  const [manualCac, setManualCac] = useState(34);
  const [manualGpPerOrder, setManualGpPerOrder] = useState(75);
  const [purchaseFreq, setPurchaseFreq] = useState(3);
  const [churnRate, setChurnRate] = useState(60);

  const useDash = mode === "dashboard" && dashboardData;

  const aov = useDash ? safe(dashboardData.activeAov, manualAov) : manualAov;
  const cac = useDash ? safe(dashboardData.blendedCac, manualCac) : manualCac;
  const gpPerOrder = useDash ? safe(dashboardData.gpPerOrder, manualGpPerOrder) : manualGpPerOrder;

  const ltv = safe(aov * purchaseFreq * (1 / (churnRate / 100)));
  const ltgp = safe(gpPerOrder * purchaseFreq * (1 / (churnRate / 100)));
  const ltvCac = cac > 0 ? safe(ltv / cac) : 0;
  const ltgpCac = cac > 0 ? safe(ltgp / cac) : 0;

  const Toggle = () => (
    <div style={{ display: "flex", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "3px", marginBottom: "20px", width: "fit-content" }}>
      {[{ id: "dashboard", label: "Use Main Dashboard" }, { id: "manual", label: "Manual Input" }].map(({ id, label }) => (
        <button key={id} onClick={() => setMode(id)} style={{ background: mode === id ? "#00e5a0" : "none", border: "none", borderRadius: "4px", color: mode === id ? "#000" : "#555", fontFamily: "monospace", fontSize: "11px", padding: "6px 14px", cursor: "pointer", fontWeight: mode === id ? "700" : "400", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <TwoCol
      left={
        <>
          <Toggle />
          <SectionLabel title="Inputs" />
          <InputField label="Average Order Value (AOV)" value={aov} onChange={setManualAov} prefix="£" readOnly={useDash} />
          <InputField label="Customer Acquisition Cost (CAC)" value={cac} onChange={setManualCac} prefix="£" readOnly={useDash} />
          <InputField label="Gross Profit Per Order" value={gpPerOrder} onChange={setManualGpPerOrder} prefix="£" readOnly={useDash} />
          <InputField label="Annual Purchase Frequency" value={purchaseFreq} onChange={setPurchaseFreq} step="0.5" />
          <InputField label="Annual Churn Rate %" value={churnRate} onChange={setChurnRate} suffix="%" />
          {useDash && (
            <div style={{ fontSize: "10px", color: "#2a6a4a", fontFamily: "monospace", marginTop: "8px", lineHeight: "1.6" }}>
              AOV, CAC, and GP/Order are sourced from the Profit tab and update automatically.
            </div>
          )}
        </>
      }
      right={
        <>
          {/* LTGP:CAC — Primary KPI */}
          <div style={{ background: "#0f1f1a", border: "1px solid #00e5a0", borderRadius: "8px", padding: "24px", marginBottom: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#00a870", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
              LTGP : CAC — Primary Profitability KPI
            </div>
            <div style={{ fontSize: "52px", color: "#00e5a0", fontWeight: "700", fontFamily: "monospace", lineHeight: 1 }}>
              {fmtX(ltgpCac)}
            </div>
            <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace", marginTop: "8px" }}>
              {ltgpCac >= 3 ? "Healthy — above 3:1 threshold" : ltgpCac >= 1 ? "Marginal — aim for 3:1" : "Critical — below break-even"}
            </div>
          </div>

          <SectionLabel title="Full Metrics" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Customer LTV", value: fmt(ltv) },
              { label: "Lifetime Gross Profit", value: fmt(ltgp) },
              { label: "LTV : CAC", value: fmtX(ltvCac) },
              { label: "CAC", value: fmt(cac) },
              { label: "AOV", value: fmt(aov) },
              { label: "GP / Order", value: fmt(gpPerOrder) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "12px" }}>
                <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "16px", color: "#aaa", fontFamily: "monospace", fontWeight: "600" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "14px" }}>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Interpretation</div>
            <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", lineHeight: "1.7" }}>
              For every £1 spent acquiring a customer, you generate <span style={{ color: "#00e5a0" }}>{fmtX(ltgpCac)}</span> in lifetime gross profit.<br />
              A ratio above 3:1 indicates a scalable, profitable acquisition model.
            </div>
          </div>
        </>
      }
    />
  );
}

// ─── Tab: Cash ───────────────────────────────────────────────────────────────

function CashTab() {
  const [startingCash, setStartingCash] = useState(5000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(14000);
  const [monthlyGrowth, setMonthlyGrowth] = useState(5);
  const [fixedCosts, setFixedCosts] = useState(3000);
  const [variableCostP, setVariableCostP] = useState(42);
  const [adSpend, setAdSpend] = useState(3200);

  const months = Array.from({ length: 6 }, (_, i) => i + 1);
  let cash = startingCash;
  const rows = months.map((m) => {
    const rev = monthlyRevenue * Math.pow(1 + monthlyGrowth / 100, m - 1);
    const variable = rev * (variableCostP / 100);
    const totalCosts = fixedCosts + variable + adSpend;
    const profit = rev - totalCosts;
    cash += profit;
    return { m, rev, totalCosts, profit, cash };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.rev, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const finalCash = rows[rows.length - 1].cash;

  return (
    <TwoCol
      left={
        <>
          <SectionLabel title="Starting Position" />
          <InputField label="Starting Cash" value={startingCash} onChange={setStartingCash} prefix="£" />
          <InputField label="Month 1 Revenue" value={monthlyRevenue} onChange={setMonthlyRevenue} prefix="£" />
          <InputField label="Monthly Growth Rate %" value={monthlyGrowth} onChange={setMonthlyGrowth} suffix="%" step="0.5" />
          <SectionLabel title="Costs" />
          <InputField label="Fixed Monthly Costs" value={fixedCosts} onChange={setFixedCosts} prefix="£" />
          <InputField label="Variable Costs (% of revenue)" value={variableCostP} onChange={setVariableCostP} suffix="%" step="0.5" />
          <InputField label="Monthly Ad Spend" value={adSpend} onChange={setAdSpend} prefix="£" />
        </>
      }
      right={
        <>
          <SectionLabel title="6-Month Cash Projection" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: "12px" }}>
            <thead>
              <tr>
                {["Mo", "Revenue", "Costs", "Profit", "Cash"].map((h) => (
                  <th key={h} style={{ textAlign: "right", color: "#444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: "8px", fontWeight: "400" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, rev, totalCosts, profit, cash }) => (
                <tr key={m} style={{ borderTop: "1px solid #161616" }}>
                  <td style={{ padding: "8px 0", color: "#555", textAlign: "right" }}>M{m}</td>
                  <td style={{ padding: "8px 0", color: "#aaa", textAlign: "right" }}>{fmt(rev)}</td>
                  <td style={{ padding: "8px 0", color: "#aaa", textAlign: "right" }}>{fmt(totalCosts)}</td>
                  <td style={{ padding: "8px 0", color: profit >= 0 ? "#00e5a0" : "#ff5f5f", textAlign: "right" }}>{fmt(profit)}</td>
                  <td style={{ padding: "8px 0", color: cash >= 0 ? "#e0e0e0" : "#ff5f5f", textAlign: "right", fontWeight: "600" }}>{fmt(cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Callout items={[
            { label: "Total Revenue", value: fmt(totalRevenue) },
            { label: "Total Profit", value: fmt(totalProfit) },
            { label: "Ending Cash", value: fmt(finalCash) },
          ]} />
        </>
      }
    />
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "profit", label: "Profit" },
  { id: "pricing", label: "Pricing" },
  { id: "ltvcac", label: "LTV & CAC" },
  { id: "cash", label: "Cash" },
];

export default function Janus() {
  const [active, setActive] = useState("profit");
  const [dashboardData, setDashboardData] = useState(null);

  const renderTab = () => {
    if (active === "profit") return <ProfitTab onDataChange={setDashboardData} />;
    if (active === "pricing") return <PricingTab />;
    if (active === "ltvcac") return <LTVCACTab dashboardData={dashboardData} />;
    if (active === "cash") return <CashTab />;
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff", letterSpacing: "0.05em" }}>JANUS</span>
          <span style={{ fontSize: "11px", color: "#333", marginLeft: "12px", letterSpacing: "0.08em" }}>by Emere — Financial Diagnostic Suite</span>
        </div>
        <div style={{ fontSize: "10px", color: "#2a2a2a", letterSpacing: "0.1em" }}>LOOKS BACK · LOOKS FORWARD</div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setActive(id)} style={{ background: "none", border: "none", borderBottom: active === id ? "2px solid #00e5a0" : "2px solid transparent", color: active === id ? "#00e5a0" : "#444", fontFamily: "monospace", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {renderTab()}
      </div>
    </div>
  );
}