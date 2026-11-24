import { useState, useEffect, useRef } from "react";
import {
  Activity,
  CheckCircle2,
  Circle,
  Download,
  Flame,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Sun,
  Timer,
  Trash2,
  Trophy,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { calculatePaceData, generateSplitStrategy } from "./utils/paceUtils";
import { soundEngine } from "./utils/audioEngine";
import { downloadStoryCard } from "./utils/storyCardGenerator";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const JS_DAY_MAP = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const DEFAULT_HABITS = [
  { id: "run", title: "Zone 2 / Shakeout Run", tag: "CARDIO", checks: [true, false, true, false, true, false, false] },
  { id: "hydro", title: "2.5L Water + Electrolytes", tag: "RECOVERY", checks: [true, true, true, false, false, false, false] },
  { id: "focus", title: "90m Deep Work / Coding Lock-In", tag: "BUILD", checks: [true, true, false, true, false, false, false] },
  { id: "sleep", title: "7.5h+ Quality Sleep", tag: "REST", checks: [true, false, true, true, false, false, false] },
];

const QUICK_DISTANCES = [
  { label: "3K Shakeout", km: "3" },
  { label: "5K Parkrun", km: "5" },
  { label: "10K Race", km: "10" },
  { label: "21.1K HM", km: "21.1" },
];

const TIMER_MODES = [
  { id: "pomodoro", label: "25m Pomodoro", seconds: 25 * 60 },
  { id: "deep", label: "50m Lock-In", seconds: 50 * 60 },
  { id: "break", label: "10m Cool Down", seconds: 10 * 60 },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mp_theme") === "dark");

  // Running Pace & Split Strategy State
  const [distance, setDistance] = useState("5");
  const [minutes, setMinutes] = useState("27");
  const [seconds, setSeconds] = useState("30");
  const [runTitle, setRunTitle] = useState("Morning Easy Run");
  const [splitStrategy, setSplitStrategy] = useState("even");
  const [showSplits, setShowSplits] = useState(false);

  // Weekly Mileage & Run Logs
  const [weeklyTarget, setWeeklyTarget] = useState(() => Number(localStorage.getItem("mp_target")) || 25);
  const [runLogs, setRunLogs] = useState(() => {
    const saved = localStorage.getItem("mp_run_logs");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, title: "Morning Zone 2", km: 5.2, pace: "6:12", date: "Senin", dayShort: "Sen" },
          { id: 2, title: "Tempo Track Session", km: 6.0, pace: "5:05", date: "Rabu", dayShort: "Rab" },
        ];
  });

  // Habit Tracker State
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem("mp_habits");
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });
  const [newHabitText, setNewHabitText] = useState("");

  // Focus Timer & Brown Noise State
  const [activeMode, setActiveMode] = useState(TIMER_MODES[0]);
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES[0].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [brownNoiseOn, setBrownNoiseOn] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(() => Number(localStorage.getItem("mp_sessions")) || 2);
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("mp_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("mp_run_logs", JSON.stringify(runLogs));
  }, [runLogs]);

  useEffect(() => {
    localStorage.setItem("mp_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("mp_target", String(weeklyTarget));
  }, [weeklyTarget]);

  useEffect(() => {
    localStorage.setItem("mp_sessions", String(sessionsDone));
  }, [sessionsDone]);

  // Cleanup audio saat komponen ditutup
  useEffect(() => {
    return () => soundEngine.stopBrownNoise();
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          soundEngine.playCompletionChime();
          if (activeMode.id !== "break") {
            setSessionsDone((s) => s + 1);
          }
          return activeMode.seconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, activeMode]);

  const paceResult = calculatePaceData(distance, minutes, seconds);
  const splitRows = generateSplitStrategy(distance, minutes, seconds, splitStrategy);

  const totalWeeklyKm = runLogs.reduce((acc, item) => acc + Number(item.km), 0);
  const mileagePercent = Math.min(100, Math.round((totalWeeklyKm / weeklyTarget) * 100));
  const totalHabitChecks = habits.reduce((sum, h) => sum + h.checks.filter(Boolean).length, 0);

  // Hitung distribusi km per hari (Sen-Min) untuk Bar Chart
  const dailyKmTotals = DAYS.map((day) => {
    const sum = runLogs
      .filter((log) => (log.dayShort || log.date?.slice(0, 3)) === day)
      .reduce((acc, item) => acc + Number(item.km), 0);
    return { day, km: Number(sum.toFixed(1)) };
  });
  const maxDailyKm = Math.max(...dailyKmTotals.map((d) => d.km), 1);

  const handleLogRun = (e) => {
    e.preventDefault();
    const kmNum = parseFloat(distance);
    if (!kmNum || kmNum <= 0) return;

    const now = new Date();
    const todayName = now.toLocaleDateString("id-ID", { weekday: "long" });
    const dayShort = JS_DAY_MAP[now.getDay()];

    const newEntry = {
      id: Date.now(),
      title: runTitle.trim() || "Daily Run",
      km: Number(kmNum.toFixed(2)),
      pace: paceResult.paceFormatted,
      date: todayName,
      dayShort,
    };
    setRunLogs([newEntry, ...runLogs]);
  };

  const toggleHabitDay = (habitId, dayIndex) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const updatedChecks = [...h.checks];
        updatedChecks[dayIndex] = !updatedChecks[dayIndex];
        return { ...h, checks: updatedChecks };
      })
    );
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitText.trim()) return;
    setHabits([
      ...habits,
      {
        id: String(Date.now()),
        title: newHabitText.trim(),
        tag: "CUSTOM",
        checks: [false, false, false, false, false, false, false],
      },
    ]);
    setNewHabitText("");
  };

  const handleToggleBrownNoise = () => {
    const active = soundEngine.toggleBrownNoise();
    setBrownNoiseOn(active);
  };

  // Export & Import JSON Backup
  const handleExportBackup = () => {
    const payload = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      weeklyTarget,
      runLogs,
      habits,
      sessionsDone,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monopace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data.runLogs)) setRunLogs(data.runLogs);
        if (Array.isArray(data.habits)) setHabits(data.habits);
        if (typeof data.weeklyTarget === "number") setWeeklyTarget(data.weeklyTarget);
        if (typeof data.sessionsDone === "number") setSessionsDone(data.sessionsDone);
      } catch {
        alert("Format file backup JSON tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const timerMinutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const timerSeconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 font-mono text-sm font-bold text-white dark:bg-white dark:text-neutral-950">
              MP
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">MONOPACE // OS</h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
                Offline-First • LocalStorage Synced
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-900 md:flex">
              <Flame className="h-3.5 w-3.5" />
              <span>{totalHabitChecks} Check-ins</span>
            </div>

            {/* Tombol IG Story Card */}
            <button
              onClick={() =>
                downloadStoryCard({
                  paceFormatted: paceResult.paceFormatted,
                  zoneCode: paceResult.zone.code,
                  totalWeeklyKm,
                  weeklyTarget,
                  totalHabitChecks,
                  sessionsDone,
                })
              }
              title="Download Kartu Statistik IG Story (9:16)"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 font-mono text-xs font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>IG Story Card</span>
            </button>

            {/* Export & Import JSON */}
            <button
              onClick={handleExportBackup}
              title="Export Backup JSON"
              className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import Backup JSON"
              className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Upload className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Bento Grid Main Layout */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        {/* KOLOM KIRI: Running Pace Lab, Race Predictor & Split Strategy (7 Kolom) */}
        <section className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-7">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  01 // Running Pace & Race Predictor
                </h2>
              </div>
              <span className="rounded-md bg-neutral-900 px-2.5 py-1 font-mono text-[11px] font-medium text-white dark:bg-white dark:text-neutral-950">
                {paceResult.zone.code}
              </span>
            </div>

            {/* Quick Distance Presets */}
            <div className="mb-4 flex flex-wrap gap-2">
              {QUICK_DISTANCES.map((preset) => (
                <button
                  key={preset.km}
                  type="button"
                  onClick={() => setDistance(preset.km)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                    distance === preset.km
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-neutral-500">Jarak (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-base font-semibold outline-none focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-white"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-neutral-500">Menit</label>
                <input
                  type="number"
                  min="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-base font-semibold outline-none focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-white"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-neutral-500">Detik</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-base font-semibold outline-none focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-white"
                />
              </div>
            </div>

            {/* Big Monochrome Pace Display */}
            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase text-neutral-500">Target Average Pace</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-5xl font-extrabold tracking-tight tabular-nums">
                      {paceResult.paceFormatted}
                    </span>
                    <span className="font-mono text-sm text-neutral-500">/km</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono text-xs uppercase text-neutral-500">Speed</p>
                  <p className="font-mono text-2xl font-bold tabular-nums">{paceResult.speedKmh} km/h</p>
                </div>
              </div>

              <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <p className="text-sm font-semibold">{paceResult.zone.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{paceResult.zone.desc}</p>
              </div>
            </div>

            {/* Race Predictor Grid */}
            <div className="mt-5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  Estimasi Waktu Race (Riegel Formula)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {paceResult.predictions.map((pred) => (
                  <div
                    key={pred.name}
                    className="rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <p className="font-mono text-[11px] text-neutral-500">{pred.name}</p>
                    <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">{pred.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Km-by-Km Split Strategy Accordion */}
            <div className="mt-5 rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowSplits(!showSplits)}
                  className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:underline dark:text-neutral-200"
                >
                  {showSplits ? "▾ Sembunyikan Split Per Km" : "▸ Lihat Strategi Split Per Km"}
                </button>

                <div className="flex rounded-lg bg-neutral-100 p-0.5 font-mono text-[11px] dark:bg-neutral-950">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitStrategy("even");
                      setShowSplits(true);
                    }}
                    className={`rounded-md px-2.5 py-1 transition ${
                      splitStrategy === "even"
                        ? "bg-white font-semibold text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                        : "text-neutral-500"
                    }`}
                  >
                    Even Split
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitStrategy("negative");
                      setShowSplits(true);
                    }}
                    className={`rounded-md px-2.5 py-1 transition ${
                      splitStrategy === "negative"
                        ? "bg-white font-semibold text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                        : "text-neutral-500"
                    }`}
                  >
                    Negative Split
                  </button>
                </div>
              </div>

              {showSplits && splitRows.length > 0 && (
                <div className="mt-3 max-h-44 overflow-y-auto border-t border-neutral-100 pt-2 dark:border-neutral-800">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-[11px] text-neutral-500">
                        <th className="py-1">Segmen</th>
                        <th className="py-1">Target Pace</th>
                        <th className="py-1 text-right">Waktu Kumulatif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                      {splitRows.map((row) => (
                        <tr key={row.label}>
                          <td className="py-1.5 font-medium">{row.label}</td>
                          <td className="py-1.5">{row.pace} /km</td>
                          <td className="py-1.5 text-right tabular-nums">{row.cumulative}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Log Run ke Weekly Mileage */}
          <form
            onSubmit={handleLogRun}
            className="mt-5 flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800 sm:flex-row"
          >
            <input
              type="text"
              placeholder="Nama sesi lari (mis. Sunset Run)"
              value={runTitle}
              onChange={(e) => setRunTitle(e.target.value)}
              className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-white"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4" />
              Log {distance || 0} km
            </button>
          </form>
        </section>

        {/* KOLOM KANAN: Lock-In Focus Timer & Weekly Mileage + Chart (5 Kolom) */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Card 02: Lock-In Focus Timer + Brown Noise */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  02 // Deep Lock-In Timer
                </h2>
              </div>

              <button
                type="button"
                onClick={handleToggleBrownNoise}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
                  brownNoiseOn
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
                }`}
              >
                {brownNoiseOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                <span>Brown Noise {brownNoiseOn ? "ON" : "OFF"}</span>
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-950">
              {TIMER_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setIsRunning(false);
                    setActiveMode(mode);
                    setTimeLeft(mode.seconds);
                  }}
                  className={`rounded-lg py-1.5 font-mono text-[11px] font-medium transition ${
                    activeMode.id === mode.id
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="my-3 text-center">
              <div className="font-mono text-6xl font-extrabold tracking-tighter tabular-nums">
                {timerMinutes}:{timerSeconds}
              </div>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                {isRunning ? "STATUS: LOCKED IN..." : `STANDBY • ${sessionsDone} SESI SELESAI`}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? "Pause" : "Start Focus"}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(activeMode.seconds);
                }}
                aria-label="Reset Timer"
                className="rounded-xl border border-neutral-200 p-2.5 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* Card 03: Weekly Mileage & Bar Chart */}
          <section className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
                03 // Weekly Mileage
              </h2>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="font-bold">{totalWeeklyKm.toFixed(1)}</span>
                <span className="text-neutral-500">/</span>
                <input
                  type="number"
                  min="1"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(Math.max(1, Number(e.target.value)))}
                  className="w-12 rounded border border-neutral-200 bg-transparent px-1 text-center font-mono text-xs dark:border-neutral-800"
                />
                <span className="text-neutral-500">km</span>
              </div>
            </div>

            {/* Monochrome Progress Bar */}
            <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full bg-neutral-900 transition-all duration-300 dark:bg-white"
                style={{ width: `${mileagePercent}%` }}
              />
            </div>

            {/* Mini Bar Chart Distribusi Mingguan */}
            <div className="mb-4 grid grid-cols-7 items-end gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800/80 dark:bg-neutral-950">
              {dailyKmTotals.map((item) => {
                const barHeightPct = item.km > 0 ? Math.max(18, Math.round((item.km / maxDailyKm) * 100)) : 8;
                return (
                  <div key={item.day} className="flex flex-col items-center gap-1.5">
                    <span className="font-mono text-[10px] text-neutral-500">{item.km > 0 ? `${item.km}` : "-"}</span>
                    <div className="flex h-14 w-full items-end justify-center">
                      <div
                        className={`w-4 rounded-t transition-all duration-300 ${
                          item.km > 0 ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-medium text-neutral-500">{item.day}</span>
                  </div>
                );
              })}
            </div>

            {/* Run History List */}
            <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
              {runLogs.length === 0 ? (
                <p className="py-3 text-center font-mono text-xs text-neutral-500">Belum ada log lari minggu ini.</p>
              ) : (
                runLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800/80 dark:bg-neutral-950"
                  >
                    <div>
                      <p className="text-xs font-semibold">{log.title}</p>
                      <p className="font-mono text-[11px] text-neutral-500">
                        {log.date} • Pace {log.pace}/km
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold">{log.km} km</span>
                      <button
                        onClick={() => setRunLogs(runLogs.filter((item) => item.id !== log.id))}
                        className="text-neutral-400 transition hover:text-neutral-900 dark:hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* BARIS BAWAH: Gen-Z Weekly Habit Tracker (Full 12 Kolom) */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-12">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
                04 // Gen-Z Weekly Habit Matrix
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">Klik lingkaran hari untuk menandai konsistensi harianmu.</p>
            </div>

            <form onSubmit={handleAddHabit} className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah habit baru..."
                value={newHabitText}
                onChange={(e) => setNewHabitText(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-white"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-950"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 font-mono text-[11px] uppercase text-neutral-500 dark:border-neutral-800">
                  <th className="pb-3 font-medium">Habit</th>
                  {DAYS.map((day) => (
                    <th key={day} className="pb-3 text-center font-medium">
                      {day}
                    </th>
                  ))}
                  <th className="pb-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {habits.map((habit) => (
                  <tr key={habit.id} className="group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-neutral-200 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 dark:border-neutral-700">
                          {habit.tag}
                        </span>
                        <span className="text-sm font-medium">{habit.title}</span>
                      </div>
                    </td>
                    {habit.checks.map((checked, idx) => (
                      <td key={idx} className="py-3 text-center">
                        <button
                          onClick={() => toggleHabitDay(habit.id, idx)}
                          className="inline-flex items-center justify-center rounded-full p-1 transition hover:scale-110"
                        >
                          {checked ? (
                            <CheckCircle2 className="h-5 w-5 text-neutral-900 dark:text-white" />
                          ) : (
                            <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-700" />
                          )}
                        </button>
                      </td>
                    ))}
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setHabits(habits.filter((h) => h.id !== habit.id))}
                        className="text-neutral-400 opacity-60 transition hover:text-neutral-900 group-hover:opacity-100 dark:hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}