import { useState, useEffect, useRef } from "react";

const PLANS = {
  free: { resumes: 1, coverLetters: 0, label: "Free" },
  pro: { resumes: 999, coverLetters: 999, label: "Pro — $9/mo" },
};

const STEPS = ["info", "experience", "skills", "generate"];

const stepLabels = ["Личные данные", "Опыт работы", "Навыки", "Генерация"];

const MOCK_RESUME = `**Иван Петров**
ivan.petrov@email.com | +7 999 123-45-67 | Москва

---

## ПРОФЕССИОНАЛЬНЫЙ ПРОФИЛЬ

Опытный разработчик с глубокой экспертизой в создании масштабируемых веб-приложений. Специализируюсь на React и Node.js, успешно реализовал более 20 проектов для компаний из сферы финтех и e-commerce.

---

## ОПЫТ РАБОТЫ

**Senior Frontend Developer** — TechCorp | 2021–н.в.
- Архитектурировал и разработал платёжную платформу, обрабатывающую 50 000+ транзакций в день
- Оптимизировал производительность, сократив время загрузки на 40%
- Руководил командой из 5 разработчиков, внедрил CI/CD процессы

**Frontend Developer** — StartupXYZ | 2019–2021
- Разработал мобильное приложение на React Native с 100 000+ загрузками
- Внедрил систему A/B тестирования, увеличив конверсию на 25%

---

## НАВЫКИ

**Технические:** React, TypeScript, Node.js, PostgreSQL, Docker, AWS
**Soft skills:** Лидерство, управление проектами, коммуникация

---

## ОБРАЗОВАНИЕ

Бакалавр компьютерных наук — МГУ | 2015–2019`;

export default function ResumeAI() {
  const [plan, setPlan] = useState("free");
  const [usedResumes, setUsedResumes] = useState(0);
  const [step, setStep] = useState("landing");
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    position: "",
    experience: "",
    company: "",
    achievements: "",
    skills: "",
    education: "",
    languages: "",
    extra: "",
  });

  const canGenerate = plan === "pro" || usedResumes < PLANS.free.resumes;

  function updateForm(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function generateResume() {
    if (!canGenerate) {
      setShowPaywall(true);
      return;
    }
    setGenerating(true);
    setStreamText("");
    setResult(null);

    const prompt = `Создай профессиональное резюме на русском языке в формате Markdown.

Данные кандидата:
- Имя: ${form.name || "Иван Петров"}
- Email: ${form.email || "ivan@email.com"}
- Телефон: ${form.phone || "+7 999 000-00-00"}
- Город: ${form.city || "Москва"}
- Желаемая должность: ${form.position || "Специалист"}
- Опыт работы: ${form.experience || "3 года"}
- Последнее место работы: ${form.company || "Компания XYZ"}
- Достижения: ${form.achievements || "Выполнял задачи проекта"}
- Навыки: ${form.skills || "Основные профессиональные навыки"}
- Образование: ${form.education || "Высшее"}
- Языки: ${form.languages || "Русский"}
- Дополнительно: ${form.extra || ""}

Сделай резюме структурированным, профессиональным и убедительным. Используй разделы: профессиональный профиль, опыт работы, навыки, образование. Напиши конкретно и ёмко. Только резюме, без пояснений.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || MOCK_RESUME;

      // Animate text reveal
      let i = 0;
      const interval = setInterval(() => {
        i += 8;
        setStreamText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setResult(text);
          setUsedResumes((u) => u + 1);
        }
      }, 16);
    } catch (e) {
      // Demo fallback
      let i = 0;
      const interval = setInterval(() => {
        i += 8;
        setStreamText(MOCK_RESUME.slice(0, i));
        if (i >= MOCK_RESUME.length) {
          clearInterval(interval);
          setResult(MOCK_RESUME);
          setUsedResumes((u) => u + 1);
        }
      }, 16);
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(result || streamText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const renderMarkdown = (text) => {
    return text
      .replace(/^## (.+)$/gm, '<h2 style="color:#c8ff00;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;margin:20px 0 8px;font-family:\'Space Mono\',monospace">$1</h2>')
      .replace(/^\*\*(.+)\*\*$/gm, '<p style="font-weight:700;color:#fff;margin:4px 0">$1</p>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #333;margin:16px 0"/>')
      .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#c8ff00">›</span><span>$1</span></div>')
      .replace(/\n\n/g, '<div style="height:8px"></div>')
      .replace(/\n/g, "<br/>");
  };

  if (step === "landing") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e0e0e0",
        fontFamily: "'DM Sans', sans-serif",
        overflowX: "hidden",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .btn-main {
            background: #c8ff00;
            color: #0a0a0a;
            border: none;
            padding: 16px 36px;
            font-size: 15px;
            font-weight: 700;
            font-family: 'Space Mono', monospace;
            cursor: pointer;
            letter-spacing: 0.05em;
            transition: all 0.2s;
            clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
          }
          .btn-main:hover { background: #fff; transform: translateY(-2px); }
          .plan-card {
            border: 1px solid #222;
            padding: 32px;
            position: relative;
            transition: border-color 0.2s;
            clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
          }
          .plan-card:hover { border-color: #c8ff00; }
          .plan-card.featured { border-color: #c8ff00; }
        `}</style>

        {/* Nav */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, color: "#c8ff00" }}>
            CV<span style={{ color: "#fff" }}>forge</span>
          </div>
          <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#666" }}>
            <span style={{ cursor: "pointer", color: "#fff" }}>Возможности</span>
            <span style={{ cursor: "pointer" }}>Цены</span>
            <span style={{ cursor: "pointer" }}>FAQ</span>
          </div>
          <button onClick={() => setStep("app")} className="btn-main" style={{ padding: "10px 24px", fontSize: 13 }}>
            Попробовать
          </button>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 40px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#111", border: "1px solid #c8ff0033", color: "#c8ff00", padding: "6px 16px", fontSize: 12, fontFamily: "'Space Mono',monospace", letterSpacing: "0.15em", marginBottom: 32 }}>
            POWERED BY CLAUDE AI
          </div>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 88px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 24 }}>
            Резюме, которое<br />
            <span style={{ color: "#c8ff00" }}>открывает двери.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.7 }}>
            ИИ создаёт профессиональное резюме за 30 секунд. Просто заполни форму — и получи готовый документ.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setStep("app")} className="btn-main">
              Создать резюме бесплатно →
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#444", marginTop: 16, fontFamily: "'Space Mono',monospace" }}>
            1 резюме бесплатно · Без регистрации
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", maxWidth: 700, margin: "0 auto 100px", gap: 1, background: "#1a1a1a" }}>
          {[["12 400+", "резюме создано"], ["94%", "получили оффер"], ["30 сек", "время генерации"]].map(([n, l]) => (
            <div key={n} style={{ background: "#0a0a0a", padding: "32px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#c8ff00", fontFamily: "'Space Mono',monospace" }}>{n}</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px 100px" }}>
          <h2 style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em" }}>Тарифы</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 600, margin: "0 auto" }}>
            <div className="plan-card">
              <div style={{ fontSize: 12, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 16 }}>FREE</div>
              <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>навсегда</div>
              {["1 резюме", "Базовый шаблон", "Скачать TXT"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, fontSize: 14, color: "#666" }}>
                  <span style={{ color: "#444" }}>✓</span> {f}
                </div>
              ))}
              <button onClick={() => setStep("app")} className="btn-main" style={{ marginTop: 24, width: "100%", background: "#111", color: "#c8ff00", border: "1px solid #c8ff00" }}>
                Начать
              </button>
            </div>
            <div className="plan-card featured">
              <div style={{ position: "absolute", top: -1, right: 24, background: "#c8ff00", color: "#000", fontSize: 10, fontFamily: "'Space Mono',monospace", padding: "4px 12px", letterSpacing: "0.1em" }}>POPULAR</div>
              <div style={{ fontSize: 12, color: "#c8ff00", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 16 }}>PRO</div>
              <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 4 }}>$9</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>в месяц</div>
              {["∞ резюмей", "Сопроводительные письма", "5 шаблонов", "PDF экспорт", "Приоритет поддержки"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: "#c8ff00" }}>✓</span> {f}
                </div>
              ))}
              <button onClick={() => { setPlan("pro"); setStep("app"); setShowUpgrade(false); }} className="btn-main" style={{ marginTop: 24, width: "100%" }}>
                Оформить PRO
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // App view
  const currentStepIndex = STEPS.indexOf("generate") >= 0 ? formStep : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e0e0e0",
      fontFamily: "'DM Sans', sans-serif",
      display: "grid",
      gridTemplateColumns: result || streamText ? "1fr 1fr" : "1fr",
      minWidth: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .input-field {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          color: #e0e0e0;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          resize: none;
        }
        .input-field:focus { border-color: #c8ff00; }
        .input-field::placeholder { color: #444; }
        .step-btn {
          background: #c8ff00;
          color: #0a0a0a;
          border: none;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          cursor: pointer;
          transition: all 0.2s;
        }
        .step-btn:hover { background: #fff; }
        .step-btn.secondary {
          background: transparent;
          color: #666;
          border: 1px solid #222;
        }
        .step-btn.secondary:hover { border-color: #666; color: #e0e0e0; background: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>

      {/* Left Panel — Form */}
      <div style={{ padding: "32px 40px", maxWidth: 600, width: "100%", justifySelf: result || streamText ? "auto" : "center" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <button onClick={() => setStep("landing")} style={{ background: "none", border: "none", color: "#c8ff00", fontFamily: "'Space Mono',monospace", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>
            CVforge
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#555", fontFamily: "'Space Mono',monospace" }}>
              {plan === "free" ? `${PLANS.free.resumes - usedResumes} из ${PLANS.free.resumes}` : "∞"} резюмей
            </span>
            {plan === "free" && (
              <button onClick={() => setShowUpgrade(true)} style={{ background: "#c8ff00", color: "#000", border: "none", padding: "6px 14px", fontSize: 11, fontFamily: "'Space Mono',monospace", cursor: "pointer", fontWeight: 700 }}>
                PRO ↑
              </button>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ flex: 1, cursor: "pointer" }} onClick={() => setFormStep(i)}>
              <div style={{ height: 2, background: i <= formStep ? "#c8ff00" : "#1a1a1a", marginBottom: 8, transition: "background 0.3s" }} />
              <div style={{ fontSize: 10, color: i === formStep ? "#c8ff00" : "#444", fontFamily: "'Space Mono',monospace", letterSpacing: "0.05em" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* Step 0 — Personal Info */}
        {formStep === 0 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Личные данные</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>Расскажи о себе — это заголовок твоего резюме</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["name", "Имя и фамилия", "Иван Петров", false],
                ["position", "Желаемая должность", "Frontend Developer", false],
                ["email", "Email", "ivan@email.com", false],
                ["phone", "Телефон", "+7 999 000-00-00", false],
                ["city", "Город", "Москва", false],
              ].map(([k, label, ph, full]) => (
                <div key={k} style={{ gridColumn: full ? "1/-1" : "auto" }}>
                  <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>{label.toUpperCase()}</label>
                  <input className="input-field" placeholder={ph} value={form[k]} onChange={e => updateForm(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Experience */}
        {formStep === 1 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Опыт работы</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>ИИ превратит это в убедительные пункты резюме</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                ["company", "Последнее место работы", "Google, Яндекс, Стартап ABC"],
                ["experience", "Сколько лет опыта и в чём", "5 лет в веб-разработке, React, Node.js"],
              ].map(([k, label, ph]) => (
                <div key={k}>
                  <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>{label.toUpperCase()}</label>
                  <input className="input-field" placeholder={ph} value={form[k]} onChange={e => updateForm(k, e.target.value)} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>ДОСТИЖЕНИЯ (ЧЕМ ГОРДИШЬСЯ?)</label>
                <textarea className="input-field" rows={4} placeholder="Увеличил продажи на 30%, запустил продукт с нуля, руководил командой из 10 человек..." value={form.achievements} onChange={e => updateForm("achievements", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>ОБРАЗОВАНИЕ</label>
                <input className="input-field" placeholder="МГУ, факультет ВМК, 2019" value={form.education} onChange={e => updateForm("education", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Skills */}
        {formStep === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Навыки и прочее</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>Перечисли ключевые компетенции</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>ТЕХНИЧЕСКИЕ НАВЫКИ</label>
                <textarea className="input-field" rows={3} placeholder="React, TypeScript, Python, SQL, Docker..." value={form.skills} onChange={e => updateForm("skills", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>ЯЗЫКИ</label>
                <input className="input-field" placeholder="Русский (родной), Английский (B2)" value={form.languages} onChange={e => updateForm("languages", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", marginBottom: 8 }}>ДОПОЛНИТЕЛЬНО (НЕОБЯЗАТЕЛЬНО)</label>
                <textarea className="input-field" rows={3} placeholder="Открытый к релокации, есть своё pet-project, сертификаты..." value={form.extra} onChange={e => updateForm("extra", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Generate */}
        {formStep === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Готово к генерации</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 40 }}>ИИ создаст профессиональное резюме на основе твоих данных</p>

            <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 24, marginBottom: 32 }}>
              <div style={{ fontSize: 12, color: "#555", fontFamily: "'Space Mono',monospace", marginBottom: 16, letterSpacing: "0.1em" }}>СВОДКА</div>
              {[
                ["Имя", form.name || "Не указано"],
                ["Должность", form.position || "Не указано"],
                ["Опыт", form.experience || "Не указано"],
                ["Навыки", form.skills ? form.skills.slice(0, 40) + "..." : "Не указано"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: "#555" }}>{k}</span>
                  <span style={{ color: "#e0e0e0" }}>{v}</span>
                </div>
              ))}
            </div>

            {!canGenerate && (
              <div style={{ background: "#1a1000", border: "1px solid #c8ff0044", padding: 16, marginBottom: 24, fontSize: 13, color: "#c8ff00" }}>
                ⚠ Лимит бесплатных резюме исчерпан. Нужен PRO.
              </div>
            )}

            <button
              onClick={generateResume}
              className="step-btn"
              disabled={generating}
              style={{ width: "100%", padding: 18, fontSize: 15, opacity: generating ? 0.7 : 1 }}
            >
              {generating ? "⚡ Генерирую..." : canGenerate ? "⚡ Создать резюме" : "🔒 Нужен PRO"}
            </button>

            {plan === "free" && canGenerate && (
              <p style={{ textAlign: "center", fontSize: 12, color: "#444", marginTop: 12, fontFamily: "'Space Mono',monospace" }}>
                Использует 1 из {PLANS.free.resumes} бесплатных резюме
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 24, borderTop: "1px solid #111" }}>
          {formStep > 0 ? (
            <button onClick={() => setFormStep(f => f - 1)} className="step-btn secondary">← Назад</button>
          ) : <div />}
          {formStep < 3 && (
            <button onClick={() => setFormStep(f => f + 1)} className="step-btn">Далее →</button>
          )}
        </div>
      </div>

      {/* Right Panel — Result */}
      {(result || streamText) && (
        <div style={{ background: "#060606", borderLeft: "1px solid #1a1a1a", padding: "32px 40px", overflow: "auto", position: "sticky", top: 0, maxHeight: "100vh" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: "#c8ff00", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em" }}>
              {result ? "✓ ГОТОВО" : "⚡ ГЕНЕРИРУЮ..."}
            </div>
            {result && (
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={copyToClipboard} className="step-btn" style={{ padding: "8px 20px", fontSize: 12 }}>
                  {copied ? "✓ Скопировано" : "Копировать"}
                </button>
                {plan === "free" && (
                  <button onClick={() => setShowUpgrade(true)} style={{ background: "none", border: "1px solid #c8ff00", color: "#c8ff00", padding: "8px 16px", fontSize: 12, fontFamily: "'Space Mono',monospace", cursor: "pointer" }}>
                    PDF (PRO)
                  </button>
                )}
              </div>
            )}
          </div>
          <div
            ref={outputRef}
            style={{ fontSize: 13, lineHeight: 1.8, color: "#aaa" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(streamText || "") }}
          />
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#0f0f0f", border: "1px solid #c8ff00", padding: 48, maxWidth: 440, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Лимит исчерпан</h2>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>
              Бесплатный план позволяет создать 1 резюме.<br />
              Перейди на PRO за <strong style={{ color: "#c8ff00" }}>$9/месяц</strong> и создавай неограниченно.
            </p>
            <button onClick={() => { setPlan("pro"); setShowPaywall(false); generateResume(); }} className="step-btn" style={{ width: "100%", padding: 16 }}>
              Оформить PRO — $9/мес
            </button>
            <button onClick={() => setShowPaywall(false)} style={{ background: "none", border: "none", color: "#444", marginTop: 16, cursor: "pointer", fontSize: 13 }}>
              Может, в другой раз
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#0f0f0f", border: "1px solid #c8ff00", padding: 48, maxWidth: 440, width: "90%" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>CVforge PRO</h2>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 32 }}>Всё без ограничений</p>
            {["∞ резюмей", "Сопроводительные письма", "PDF экспорт", "5 шаблонов", "Приоритетная поддержка"].map(f => (
              <div key={f} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, fontSize: 14 }}>
                <span style={{ color: "#c8ff00" }}>✓</span> {f}
              </div>
            ))}
            <div style={{ fontSize: 36, fontWeight: 700, margin: "24px 0 8px" }}>$9 <span style={{ fontSize: 16, color: "#555", fontWeight: 400 }}>/ месяц</span></div>
            <button onClick={() => { setPlan("pro"); setShowUpgrade(false); }} className="step-btn" style={{ width: "100%", padding: 16, marginTop: 8 }}>
              Активировать PRO
            </button>
            <button onClick={() => setShowUpgrade(false)} style={{ background: "none", border: "none", color: "#444", marginTop: 12, cursor: "pointer", fontSize: 13, display: "block", textAlign: "center", width: "100%" }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
