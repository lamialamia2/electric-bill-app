import { useEffect, useMemo, useState } from "react";

const MEMBERS = [
  { id: 0, name: "মনোয়ার", color: "#3B82F6" },
  { id: 1, name: "নিঝুম", color: "#8B5CF6" },
  { id: 2, name: "ইস্রাফিল", color: "#F59E0B" },
  { id: 3, name: "ফরিদ", color: "#10B981" },
];

const STORAGE_KEY = "electricBillAppDataV2";
const DRAFT_KEY = "electricBillAppDraftV2";

const initialMember = () => ({ start: "", end: "", pay: "", prev: "" });
const toNum = value => parseFloat(value) || 0;

const formatMonth = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const currentMonth = () => formatMonth(new Date());
const maxMonth = currentMonth();

function previousMonth(month) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 2, 1);
  return formatMonth(date);
}

function monthLabel(month) {
  if (!month) return "মাস নেই";
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
}

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function NumInput({ value, onChange, placeholder, prefix }) {
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94a3b8",
          fontSize: 13,
          pointerEvents: "none"
        }}>
          {prefix}
        </span>
      )}

      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: prefix ? "9px 10px 9px 28px" : "9px 10px",
          background: "#1e293b",
          border: "1.5px solid #334155",
          borderRadius: 8,
          color: "#f1f5f9",
          fontSize: 13,
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "'Noto Sans Bengali', sans-serif"
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flex: 1,
      position: "relative",
      zIndex: 1
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        transition: "all .3s",
        background: active ? "#3B82F6" : done ? "#10B981" : "#1e293b",
        border: `2px solid ${active ? "#3B82F6" : done ? "#10B981" : "#334155"}`,
        color: active || done ? "white" : "#64748b"
      }}>
        {done ? "✓" : n}
      </div>

      <div style={{
        fontSize: 11,
        marginTop: 4,
        color: active ? "#3B82F6" : done ? "#10B981" : "#64748b",
        fontWeight: active ? 600 : 400
      }}>
        {label}
      </div>
    </div>
  );
}

function Pill({ value }) {
  const pos = value >= 0;

  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      background: pos ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
      color: pos ? "#10B981" : "#EF4444"
    }}>
      {pos ? "+" : "−"}{Math.abs(Math.round(value))} ৳
    </span>
  );
}

export default function App() {
  const savedDraft = loadJson(DRAFT_KEY, null);

  const [view, setView] = useState("list");
  const [step, setStep] = useState(savedDraft?.step || 1);
  const [month, setMonth] = useState(savedDraft?.month || currentMonth());
  const [members, setMembers] = useState(savedDraft?.members || MEMBERS.map(initialMember));
  const [usePrev, setUsePrev] = useState(savedDraft?.usePrev || false);
  const [records, setRecords] = useState(() => loadJson(STORAGE_KEY, []));
  const [notice, setNotice] = useState("");

  const update = (i, field, val) => {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const units = members.map(m => {
    const u = toNum(m.end) - toNum(m.start);
    return isNaN(u) || u < 0 ? 0 : u;
  });

  const totalUnits = units.reduce((a, b) => a + b, 0);
  const totalPay = members.reduce((a, m) => a + toNum(m.pay), 0);
  const perUnit = totalUnits > 0 ? totalPay / totalUnits : 0;

  const results = MEMBERS.map((person, i) => {
    const owed = units[i] * perUnit;
    const paid = toNum(members[i].pay);
    const prev = toNum(members[i].prev);
    const thisBal = paid - owed;
    const totalBal = usePrev ? thisBal + prev : thisBal;

    return {
      ...person,
      start: members[i].start,
      end: members[i].end,
      pay: members[i].pay,
      prev,
      unit: units[i],
      paid,
      owed,
      thisBal,
      totalBal
    };
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      step,
      month,
      members,
      usePrev
    }));
  }, [step, month, members, usePrev]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const groupedRecords = useMemo(() => {
    return records
      .slice()
      .sort((a, b) =>
        (b.month || "").localeCompare(a.month || "") ||
        (b.updatedAt || "").localeCompare(a.updatedAt || "")
      )
      .reduce((acc, item) => {
        if (!acc[item.month]) acc[item.month] = [];
        acc[item.month].push(item);
        return acc;
      }, {});
  }, [records]);

  const showNotice = text => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2200);
  };

  const getRecordByMonth = selectedMonth => {
    return records.find(item => item.month === selectedMonth);
  };

  const buildMembersFromPreviousMonth = selectedMonth => {
    const existing = getRecordByMonth(selectedMonth);

    if (existing) {
      setMonth(existing.month || selectedMonth);
      setMembers(existing.members || MEMBERS.map(initialMember));
      setUsePrev(!!existing.usePrev);
      setStep(1);
      setView("form");
      showNotice(`${monthLabel(existing.month)} মাসের হিসাব লোড হয়েছে`);
      return;
    }

    const prevMonth = previousMonth(selectedMonth);
    const prevRecord = getRecordByMonth(prevMonth);

    if (prevRecord && Array.isArray(prevRecord.results)) {
      const nextMembers = MEMBERS.map((member, i) => {
        const oldMember = prevRecord.results[i] || {};
        const oldInput = prevRecord.members?.[i] || {};

        return {
          start: String(oldMember.end || oldInput.end || ""),
          end: "",
          pay: "",
          prev: String(Math.round(oldMember.totalBal || 0))
        };
      });

      setMembers(nextMembers);
      setUsePrev(true);
      showNotice(`${monthLabel(prevMonth)} থেকে আগের রিডিং ও ব্যালেন্স auto এসেছে`);
    } else {
      setMembers(MEMBERS.map(initialMember));
      setUsePrev(false);
    }

    setMonth(selectedMonth);
    setStep(1);
    setView("form");
  };

  const startNewMonth = () => {
    buildMembersFromPreviousMonth(currentMonth());
  };

  const saveRecord = () => {
    const record = {
      id: month,
      month,
      members,
      usePrev,
      totalUnits,
      totalPay,
      perUnit,
      results,
      updatedAt: new Date().toISOString()
    };

    setRecords(prev => {
      const withoutSameMonth = prev.filter(item => item.month !== month);
      return [record, ...withoutSameMonth];
    });

    showNotice(`${monthLabel(month)} মাসের হিসাব সেভ হয়েছে`);
  };

  const calculateAndSave = () => {
    saveRecord();
    setStep(3);
  };

  const loadRecord = record => {
    setMonth(record.month || currentMonth());
    setMembers(record.members || MEMBERS.map(initialMember));
    setUsePrev(!!record.usePrev);
    setStep(3);
    setView("form");
    showNotice(`${monthLabel(record.month)} মাসের হিসাব লোড হয়েছে`);
  };

  const deleteRecord = monthToDelete => {
    setRecords(prev => prev.filter(item => item.month !== monthToDelete));

    if (month === monthToDelete) {
      setMembers(MEMBERS.map(initialMember));
      setUsePrev(false);
      setStep(1);
    }

    showNotice(`${monthLabel(monthToDelete)} মুছে ফেলা হয়েছে`);
  };

  const reset = () => {
    const nextMonth = currentMonth();
    localStorage.removeItem(DRAFT_KEY);
    buildMembersFromPreviousMonth(nextMonth);
  };

  const handleMonthChange = value => {
    buildMembersFromPreviousMonth(value);
  };

  const renderSavedList = () => (
    <div>
      <div style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 14,
        padding: "14px",
        marginBottom: 14
      }}>
        <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>
          শুরুতেই সেভড লিস্ট
        </div>

        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.45, marginBottom: 14 }}>
          অ্যাপ open বা reload করলে এই page-এই list দেখা যাবে। নতুন হিসাব করলে আগের মাস history থাকলে রিডিং ও ব্যালেন্স auto আসবে।
        </div>

        <button
          onClick={startNewMonth}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: "#3B82F6",
            color: "white",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          + নতুন মাসের হিসাব
        </button>
      </div>

      <div style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: "14px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>
              মাসভিত্তিক সেভড লিস্ট
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              Reload দিলেও এই list localStorage থেকে থাকবে
            </div>
          </div>

          <span style={{
            background: "#1e293b",
            color: "#94a3b8",
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 800
          }}>
            {records.length} মাস
          </span>
        </div>

        {Object.keys(groupedRecords).length === 0 ? (
          <div style={{
            background: "#0f172a",
            borderRadius: 10,
            padding: "16px",
            color: "#64748b",
            fontSize: 13,
            textAlign: "center"
          }}>
            এখনো কোনো মাসের হিসাব সেভ করা নেই
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {Object.entries(groupedRecords).map(([groupMonth, list]) => (
              <div key={groupMonth}>
                <div style={{
                  color: "#93c5fd",
                  fontSize: 13,
                  fontWeight: 900,
                  margin: "8px 0 8px"
                }}>
                  {monthLabel(groupMonth)}
                </div>

                {list.map(record => (
                  <div
                    key={record.id}
                    style={{
                      background: "#0f172a",
                      borderRadius: 10,
                      padding: "12px",
                      marginBottom: 8,
                      border: "1px solid #1e293b"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 8
                    }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 14 }}>
                          {monthLabel(record.month)}
                        </div>

                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                          মোট ইউনিট {record.totalUnits} • মোট টাকা {Math.round(record.totalPay)} ৳ • প্রতি ইউনিট {Number(record.perUnit || 0).toFixed(2)} ৳
                        </div>
                      </div>

                      <div style={{ color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(record.updatedAt).toLocaleDateString("bn-BD")}
                      </div>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 6,
                      marginBottom: 10
                    }}>
                      {(record.results || []).map(r => {
                        const pos = r.totalBal >= 0;

                        return (
                          <div
                            key={r.id}
                            style={{
                              background: "#1e293b",
                              borderRadius: 8,
                              padding: "7px",
                              borderTop: `2px solid ${r.color}`
                            }}
                          >
                            <div style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {r.name}
                            </div>

                            <div style={{
                              fontSize: 12,
                              color: pos ? "#10B981" : "#EF4444",
                              fontWeight: 900
                            }}>
                              {pos ? "+" : "−"}{Math.abs(Math.round(r.totalBal))} ৳
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8
                    }}>
                      <button
                        onClick={() => loadRecord(record)}
                        style={{
                          padding: "9px",
                          borderRadius: 8,
                          border: "1px solid #334155",
                          background: "#1e293b",
                          color: "#f1f5f9",
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        লোড/দেখুন
                      </button>

                      <button
                        onClick={() => deleteRecord(record.month)}
                        style={{
                          padding: "9px",
                          borderRadius: 8,
                          border: "1px solid rgba(239,68,68,.4)",
                          background: "rgba(239,68,68,.1)",
                          color: "#FCA5A5",
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        ডিলিট
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#f1f5f9",
      fontFamily: "'Noto Sans Bengali', 'Segoe UI', sans-serif",
      padding: "16px 12px",
      maxWidth: 560,
      margin: "0 auto"
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4
        }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <h1 style={{
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: -0.5,
            color: "#f1f5f9",
            margin: 0
          }}>
            বিদ্যুৎ বিল হিসাব
          </h1>
        </div>

        <p style={{
          fontSize: 12,
          color: "#64748b",
          margin: 0
        }}>
          মনোয়ার • নিঝুম • ইস্রাফিল • ফরিদ
        </p>
      </div>

      {notice && (
        <div style={{
          background: "rgba(16,185,129,.15)",
          color: "#10B981",
          border: "1px solid rgba(16,185,129,.25)",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 800
        }}>
          ✓ {notice}
        </div>
      )}

      {view === "list" ? (
        renderSavedList()
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14
          }}>
            <button
              onClick={() => setView("list")}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "1.5px solid #334155",
                background: "#1e293b",
                color: "#f1f5f9",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              ← সেভড লিস্ট
            </button>

            <button
              onClick={startNewMonth}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#3B82F6",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              + নতুন হিসাব
            </button>
          </div>

          <div style={{
            background: "#1e293b",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16
          }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              মাস সিলেক্ট করুন
            </div>

            <input
              type="month"
              value={month}
              max={maxMonth}
              onChange={e => handleMonthChange(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
                borderRadius: 8,
                border: "1.5px solid #334155",
                background: "#0f172a",
                color: "#f1f5f9",
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none"
              }}
            />

            <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
              বর্তমান হিসাব: <b>{monthLabel(month)}</b>
            </div>

            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>
              এই মাসে saved record না থাকলে আগের মাসের শেষ রিডিং ও ব্যালেন্স auto-fill হবে
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: 24,
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: 15,
              left: "16%",
              right: "16%",
              height: 2,
              background: "#1e293b",
              zIndex: 0
            }}>
              <div style={{
                height: "100%",
                background: "#3B82F6",
                width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
                transition: "width .4s ease"
              }} />
            </div>

            {[["১", "ইউনিট"], ["২", "পেমেন্ট"], ["৩", "ফলাফল"]].map(([n, label], idx) => (
              <StepDot key={idx} n={idx + 1} current={step} label={label} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div style={{
                display: "grid",
                gap: 12,
                marginBottom: 16
              }}>
                {MEMBERS.map((m, i) => (
                  <div key={i} style={{
                    background: "#1e293b",
                    borderRadius: 12,
                    padding: "14px 16px",
                    borderLeft: `3px solid ${m.color}`
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12
                    }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>
                        {m.name}
                      </span>

                      {units[i] > 0 && (
                        <span style={{
                          background: `${m.color}22`,
                          color: m.color,
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 800
                        }}>
                          {units[i]} ইউনিট
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                          আগের রিডিং
                        </div>

                        <NumInput
                          value={members[i].start}
                          onChange={v => update(i, "start", v)}
                          placeholder="যেমন: 20628"
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                          এই মাসের রিডিং
                        </div>

                        <NumInput
                          value={members[i].end}
                          onChange={v => update(i, "end", v)}
                          placeholder="যেমন: 20881"
                        />
                      </div>
                    </div>

                    {toNum(members[i].end) - toNum(members[i].start) < 0 && members[i].end && (
                      <div style={{
                        color: "#EF4444",
                        fontSize: 12,
                        marginTop: 6
                      }}>
                        ⚠ রিডিং ভুল — শেষ রিডিং বেশি হওয়া দরকার
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 20
              }}>
                <div style={{
                  background: "#1e293b",
                  borderRadius: 10,
                  padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    মোট ইউনিট
                  </div>

                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#3B82F6"
                  }}>
                    {totalUnits}
                  </div>
                </div>

                <div style={{
                  background: "#1e293b",
                  borderRadius: 10,
                  padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    সেভড মাস
                  </div>

                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#10B981"
                  }}>
                    {records.length}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 10,
                  border: "none",
                  background: "#3B82F6",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                পরবর্তী → পেমেন্ট
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
                marginBottom: 16
              }}>
                {[
                  ["মোট ইউনিট", totalUnits, "#3B82F6"],
                  ["মোট টাকা", totalPay.toLocaleString() + " ৳", "#F59E0B"],
                  ["প্রতি ইউনিট", perUnit > 0 ? perUnit.toFixed(2) + " ৳" : "— ৳", "#10B981"]
                ].map(([label, val, color], i) => (
                  <div key={i} style={{
                    background: "#1e293b",
                    borderRadius: 10,
                    padding: "10px 12px"
                  }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>
                      {label}
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 900, color }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                display: "grid",
                gap: 10,
                marginBottom: 16
              }}>
                {MEMBERS.map((m, i) => {
                  const owed = units[i] * perUnit;
                  const paid = toNum(members[i].pay);
                  const diff = paid - owed;

                  return (
                    <div key={i} style={{
                      background: "#1e293b",
                      borderRadius: 12,
                      padding: "14px 16px",
                      borderLeft: `3px solid ${m.color}`
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10
                      }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>
                            {m.name}
                          </div>

                          <div style={{
                            fontSize: 11,
                            color: "#64748b",
                            marginTop: 2
                          }}>
                            {units[i]} ইউনিট × {perUnit.toFixed(2)} ={" "}
                            <span style={{
                              color: "#f1f5f9",
                              fontWeight: 700
                            }}>
                              {Math.round(owed)} ৳
                            </span>{" "}
                            দেওয়ার কথা
                          </div>
                        </div>

                        {members[i].pay && perUnit > 0 && <Pill value={diff} />}
                      </div>

                      <NumInput
                        value={members[i].pay}
                        onChange={v => update(i, "pay", v)}
                        placeholder="০ ৳"
                        prefix="৳"
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: "#1e293b",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 16
              }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  marginBottom: usePrev ? 14 : 0
                }}>
                  <div
                    onClick={() => setUsePrev(!usePrev)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      background: usePrev ? "#3B82F6" : "#334155",
                      position: "relative",
                      transition: "background .2s",
                      flexShrink: 0,
                      cursor: "pointer"
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      top: 3,
                      left: usePrev ? 20 : 3,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "white",
                      transition: "left .2s"
                    }} />
                  </div>

                  <span style={{
                    fontSize: 13,
                    fontWeight: 700
                  }}>
                    আগের মাসের ব্যালেন্স যোগ করব
                  </span>
                </label>

                {usePrev && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      + পাওনা / − দেনা লিখুন
                    </div>

                    {MEMBERS.map((m, i) => (
                      <div key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: m.color,
                          flexShrink: 0
                        }} />

                        <span style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 700
                        }}>
                          {m.name}
                        </span>

                        <div style={{ width: 140 }}>
                          <NumInput
                            value={members[i].prev}
                            onChange={v => update(i, "prev", v)}
                            placeholder="যেমন: 508 বা -56"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: "13px",
                    borderRadius: 10,
                    border: "1.5px solid #334155",
                    background: "transparent",
                    color: "#94a3b8",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ← আগে
                </button>

                <button
                  onClick={calculateAndSave}
                  style={{
                    padding: "13px",
                    borderRadius: 10,
                    border: "none",
                    background: "#10B981",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  হিসাব + সেভ ✓
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
                marginBottom: 16
              }}>
                {[
                  ["মোট ইউনিট", totalUnits, "#3B82F6"],
                  ["মোট টাকা", totalPay.toLocaleString() + " ৳", "#F59E0B"],
                  ["প্রতি ইউনিট", perUnit.toFixed(2) + " ৳", "#10B981"]
                ].map(([label, val, color], i) => (
                  <div key={i} style={{
                    background: "#1e293b",
                    borderRadius: 10,
                    padding: "10px 12px"
                  }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>
                      {label}
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 900, color }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                display: "grid",
                gap: 10,
                marginBottom: 16
              }}>
                {results.map((item, i) => {
                  const pos = item.totalBal >= 0;

                  return (
                    <div key={i} style={{
                      background: "#1e293b",
                      borderRadius: 12,
                      padding: "14px 16px",
                      borderLeft: `3px solid ${item.color}`
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10
                      }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>
                          {item.name}
                        </span>

                        <div style={{
                          background: pos ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
                          color: pos ? "#10B981" : "#EF4444",
                          padding: "4px 14px",
                          borderRadius: 20,
                          fontSize: 15,
                          fontWeight: 900
                        }}>
                          {pos ? "+" : "−"}{Math.abs(Math.round(item.totalBal))} ৳
                        </div>
                      </div>

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 8
                      }}>
                        {[
                          ["ইউনিট", `${item.unit}`, `${toNum(members[i].end)} − ${toNum(members[i].start)}`],
                          ["দেওয়ার কথা", `${Math.round(item.owed)} ৳`, `${item.unit} × ${perUnit.toFixed(2)}`],
                          ["দিয়েছে", `${item.paid} ৳`, ""],
                        ].map(([label, val, sub], j) => (
                          <div key={j} style={{
                            background: "#0f172a",
                            borderRadius: 8,
                            padding: "8px 10px"
                          }}>
                            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
                              {label}
                            </div>

                            <div style={{ fontSize: 13, fontWeight: 800 }}>
                              {val}
                            </div>

                            {sub && (
                              <div style={{
                                fontSize: 10,
                                color: "#475569",
                                marginTop: 1
                              }}>
                                {sub}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{
                        marginTop: 10,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap"
                      }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          এই মাস:{" "}
                          <span style={{
                            color: item.thisBal >= 0 ? "#10B981" : "#EF4444",
                            fontWeight: 700
                          }}>
                            {item.thisBal >= 0 ? "+" : "−"}{Math.abs(Math.round(item.thisBal))} ৳
                          </span>

                          <span style={{ color: "#475569", marginLeft: 4 }}>
                            ({item.paid} − {Math.round(item.owed)})
                          </span>
                        </div>

                        {usePrev && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            + আগের:{" "}
                            <span style={{
                              color: item.prev >= 0 ? "#10B981" : "#EF4444",
                              fontWeight: 700
                            }}>
                              {item.prev >= 0 ? "+" : "−"}{Math.abs(item.prev)} ৳
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
                fontSize: 12,
                color: "#64748b"
              }}>
                <div style={{
                  marginBottom: 4,
                  fontWeight: 800,
                  color: "#94a3b8"
                }}>
                  হিসাবের সূত্র:
                </div>

                <div>
                  প্রতি ইউনিট = মোট টাকা ({totalPay} ৳) ÷ মোট ইউনিট ({totalUnits}) ={" "}
                  <span style={{
                    color: "#F59E0B",
                    fontWeight: 800
                  }}>
                    {perUnit.toFixed(2)} ৳
                  </span>
                </div>

                <div style={{ marginTop: 4 }}>
                  মোট ব্যালেন্স = এই মাস ব্যালেন্স {usePrev ? "+ আগের ব্যালেন্স" : ""}
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10
              }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: "13px",
                    borderRadius: 10,
                    border: "1.5px solid #334155",
                    background: "transparent",
                    color: "#94a3b8",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ← সংশোধন
                </button>

                <button
                  onClick={saveRecord}
                  style={{
                    padding: "13px",
                    borderRadius: 10,
                    border: "none",
                    background: "#10B981",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  সেভ
                </button>

                <button
                  onClick={reset}
                  style={{
                    padding: "13px",
                    borderRadius: 10,
                    border: "none",
                    background: "#3B82F6",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  নতুন মাস ↺
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
