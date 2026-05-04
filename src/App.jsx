import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";

const MEMBERS = [
  { id: 0, name: "মনোয়ার", color: "#3B82F6" },
  { id: 1, name: "নিঝুম",   color: "#8B5CF6" },
  { id: 2, name: "ইস্রাফিল",color: "#F59E0B" },
  { id: 3, name: "ফরিদ",    color: "#10B981" },
];

const initialMember = () => ({ start: "", end: "", pay: "", prev: "" });

function NumInput({ value, onChange, placeholder, prefix }) {
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          color: "#94a3b8", fontSize: 13, pointerEvents: "none"
        }}>{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: prefix ? "9px 10px 9px 28px" : "9px 10px",
          background: "#1e293b", border: "1.5px solid #334155",
          borderRadius: 8, color: "#f1f5f9", fontSize: 13,
          outline: "none", fontFamily: "'Noto Sans Bengali', sans-serif"
        }}
        onFocus={e => e.target.style.borderColor = "#3B82F6"}
        onBlur={e => e.target.style.borderColor = "#334155"}
      />
    </div>
  );
}

function StepDot({ n, current, label }) {
  const done = n < current;
  const active = n === current;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 13, fontWeight: 700, transition: "all .3s",
        background: active ? "#3B82F6" : done ? "#10B981" : "#1e293b",
        border: `2px solid ${active ? "#3B82F6" : done ? "#10B981" : "#334155"}`,
        color: active || done ? "white" : "#64748b"
      }}>
        {done ? "✓" : n}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color: active ? "#3B82F6" : done ? "#10B981" : "#64748b", fontWeight: active ? 600 : 400 }}>
        {label}
      </div>
    </div>
  );
}

function Pill({ value }) {
  const pos = value >= 0;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700,
      background: pos ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
      color: pos ? "#10B981" : "#EF4444"
    }}>
      {pos ? "+" : "−"}{Math.abs(Math.round(value))} ৳
    </span>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState(MEMBERS.map(initialMember));
  const [usePrev, setUsePrev] = useState(false);

  const update = (i, field, val) => {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const units = members.map(m => {
    const u = parseFloat(m.end) - parseFloat(m.start);
    return isNaN(u) || u < 0 ? 0 : u;
  });
  const totalUnits = units.reduce((a, b) => a + b, 0);
  const totalPay = members.reduce((a, m) => a + (parseFloat(m.pay) || 0), 0);
  const perUnit = totalUnits > 0 ? totalPay / totalUnits : 0;

  const reset = () => {
    setMembers(MEMBERS.map(initialMember));
    setUsePrev(false);
    setStep(1);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Noto Sans Bengali', 'Segoe UI', sans-serif",
      padding: "16px 12px", maxWidth: 520, margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: "#f1f5f9" }}>বিদ্যুৎ বিল হিসাব</h1>
        </div>
        <p style={{ fontSize: 12, color: "#64748b" }}>মনোয়ার • নিঝুম • ইস্রাফিল • ফরিদ</p>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, position: "relative" }}>
        <div style={{
          position: "absolute", top: 15, left: "16%", right: "16%", height: 2,
          background: "#1e293b", zIndex: 0
        }}>
          <div style={{
            height: "100%", background: "#3B82F6",
            width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
            transition: "width .4s ease"
          }} />
        </div>
        {[["১", "ইউনিট"], ["২", "পেমেন্ট"], ["৩", "ফলাফল"]].map(([n, label], idx) => (
          <StepDot key={idx} n={idx + 1} current={step} label={label} />
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {MEMBERS.map((m, i) => (
              <div key={i} style={{
                background: "#1e293b", borderRadius: 12, padding: "14px 16px",
                borderLeft: `3px solid ${m.color}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</span>
                  {units[i] > 0 && (
                    <span style={{
                      background: `${m.color}22`, color: m.color,
                      padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700
                    }}>
                      {units[i]} ইউনিট
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>আগের রিডিং</div>
                    <NumInput value={members[i].start} onChange={v => update(i, "start", v)} placeholder="যেমন: 20628" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>এই মাসের রিডিং</div>
                    <NumInput value={members[i].end} onChange={v => update(i, "end", v)} placeholder="যেমন: 20881" />
                  </div>
                </div>
                {parseFloat(members[i].end) - parseFloat(members[i].start) < 0 && members[i].end && (
                  <div style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>⚠ রিডিং ভুল — শেষ রিডিং বেশি হওয়া দরকার</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>মোট ইউনিট</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#3B82F6" }}>{totalUnits}</div>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>৪ জনের মোট</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#64748b" }}>— ৳</div>
            </div>
          </div>

          <button onClick={() => setStep(2)} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: "#3B82F6", color: "white", fontSize: 15, fontWeight: 700,
            cursor: "pointer"
          }}>
            পরবর্তী → পেমেন্ট
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              ["মোট ইউনিট", totalUnits, "#3B82F6"],
              ["মোট টাকা", totalPay.toLocaleString() + " ৳", "#F59E0B"],
              ["প্রতি ইউনিট", perUnit > 0 ? perUnit.toFixed(2) + " ৳" : "— ৳", "#10B981"]
            ].map(([label, val, color], i) => (
              <div key={i} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {MEMBERS.map((m, i) => {
              const owed = units[i] * perUnit;
              const paid = parseFloat(members[i].pay) || 0;
              const diff = paid - owed;
              return (
                <div key={i} style={{
                  background: "#1e293b", borderRadius: 12, padding: "14px 16px",
                  borderLeft: `3px solid ${m.color}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        {units[i]} ইউনিট × {perUnit.toFixed(2)} = <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{Math.round(owed)} ৳</span> দেওয়ার কথা
                      </div>
                    </div>
                    {members[i].pay && perUnit > 0 && <Pill value={diff} />}
                  </div>
                  <NumInput value={members[i].pay} onChange={v => update(i, "pay", v)} placeholder="০ ৳" prefix="৳" />
                </div>
              );
            })}
          </div>

          <div style={{ background: "#1e293b", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: usePrev ? 14 : 0 }}>
              <div
                onClick={() => setUsePrev(!usePrev)}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: usePrev ? "#3B82F6" : "#334155",
                  position: "relative", transition: "background .2s", flexShrink: 0, cursor: "pointer"
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: usePrev ? 20 : 3, width: 16, height: 16,
                  borderRadius: "50%", background: "white", transition: "left .2s"
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>আগের মাসের ব্যালেন্স যোগ করব</span>
            </label>
            {usePrev && (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>+ পাওনা / − দেনা লিখুন</div>
                {MEMBERS.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                    <div style={{ width: 140 }}>
                      <NumInput value={members[i].prev} onChange={v => update(i, "prev", v)} placeholder="যেমন: 508 বা -56" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{
              padding: "13px", borderRadius: 10, border: "1.5px solid #334155",
              background: "transparent", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>← আগে</button>
            <button onClick={() => setStep(3)} style={{
              padding: "13px", borderRadius: 10, border: "none",
              background: "#10B981", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer"
            }}>হিসাব করো ✓</button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              ["মোট ইউনিট", totalUnits, "#3B82F6"],
              ["মোট টাকা", totalPay.toLocaleString() + " ৳", "#F59E0B"],
              ["প্রতি ইউনিট", perUnit.toFixed(2) + " ৳", "#10B981"]
            ].map(([label, val, color], i) => (
              <div key={i} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {MEMBERS.map((m, i) => {
              const owed = units[i] * perUnit;
              const paid = parseFloat(members[i].pay) || 0;
              const prev = parseFloat(members[i].prev) || 0;
              const thisBal = paid - owed;
              const totalBal = usePrev ? thisBal + prev : thisBal;
              const pos = totalBal >= 0;

              return (
                <div key={i} style={{
                  background: "#1e293b", borderRadius: 12, padding: "14px 16px",
                  borderLeft: `3px solid ${m.color}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</span>
                    <div style={{
                      background: pos ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
                      color: pos ? "#10B981" : "#EF4444",
                      padding: "4px 14px", borderRadius: 20, fontSize: 15, fontWeight: 800
                    }}>
                      {pos ? "+" : "−"}{Math.abs(Math.round(totalBal))} ৳
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[
                      ["ইউনিট", `${units[i]}`, `${parseFloat(members[i].end)||0} − ${parseFloat(members[i].start)||0}`],
                      ["দেওয়ার কথা", `${Math.round(owed)} ৳`, `${units[i]} × ${perUnit.toFixed(2)}`],
                      ["দিয়েছে", `${paid} ৳`, ""],
                    ].map(([label, val, sub], j) => (
                      <div key={j} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{val}</div>
                        {sub && <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{sub}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      এই মাস: <span style={{ color: thisBal >= 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>
                        {thisBal >= 0 ? "+" : "−"}{Math.abs(Math.round(thisBal))} ৳
                      </span>
                      <span style={{ color: "#475569", marginLeft: 4 }}>({paid} − {Math.round(owed)})</span>
                    </div>
                    {usePrev && (
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        + আগের: <span style={{ color: prev >= 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>
                          {prev >= 0 ? "+" : "−"}{Math.abs(prev)} ৳
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#64748b" }}>
            <div style={{ marginBottom: 4, fontWeight: 600, color: "#94a3b8" }}>হিসাবের সূত্র:</div>
            <div>প্রতি ইউনিট = মোট টাকা ({totalPay} ৳) ÷ মোট ইউনিট ({totalUnits}) = <span style={{ color: "#F59E0B", fontWeight: 700 }}>{perUnit.toFixed(2)} ৳</span></div>
            <div style={{ marginTop: 4 }}>মোট ব্যালেন্স = এই মাস ব্যালেন্স {usePrev ? "+ আগের ব্যালেন্স" : ""}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setStep(2)} style={{
              padding: "13px", borderRadius: 10, border: "1.5px solid #334155",
              background: "transparent", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>← সংশোধন</button>
            <button onClick={reset} style={{
              padding: "13px", borderRadius: 10, border: "none",
              background: "#3B82F6", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer"
            }}>নতুন মাস ↺</button>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
