export function formatSecondsToTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0 || !isFinite(totalSeconds)) return "00:00";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.round(totalSeconds % 60);

  const pad = (n) => String(n).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export function formatPaceFromSeconds(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || !isFinite(secPerKm)) return "0:00";
  let mins = Math.floor(secPerKm / 60);
  let secs = Math.round(secPerKm % 60);
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function calculatePaceData(distanceKm, minutes, seconds) {
  const dist = parseFloat(distanceKm);
  const totalSec = parseInt(minutes || 0, 10) * 60 + parseInt(seconds || 0, 10);

  if (!dist || dist <= 0 || totalSec <= 0) {
    return {
      paceFormatted: "0:00",
      speedKmh: "0.0",
      zone: { code: "IDLE", label: "Masukkan jarak & target waktu", desc: "Siap menghitung pace larimu." },
      predictions: [],
    };
  }

  const paceSecPerKm = totalSec / dist;
  const paceFormatted = formatPaceFromSeconds(paceSecPerKm);
  const speedKmh = (dist / (totalSec / 3600)).toFixed(1);

  let zone;
  if (paceSecPerKm >= 390) {
    zone = {
      code: "ZONE 2 // EASY",
      label: "Kalcer & Conversational Run",
      desc: "Pace santai buat bangun aerobic base sambil ngobrol atau dengerin podcast.",
    };
  } else if (paceSecPerKm >= 315) {
    zone = {
      code: "ZONE 3 // STEADY",
      label: "Aerobic Cruise / Sunday Long Run",
      desc: "Ritme stabil buat nambah mileage mingguan tanpa bikin kaki cepat burnout.",
    };
  } else if (paceSecPerKm >= 265) {
    zone = {
      code: "ZONE 4 // TEMPO",
      label: "Threshold Lock-In Pace",
      desc: "Pace kompetitif buat ngejar PB (Personal Best) di event race 5K–10K.",
    };
  } else {
    zone = {
      code: "ZONE 5 // VO2 MAX",
      label: "All-Out Race / Sub-20 5K Mode",
      desc: "Intensitas maksimal untuk interval track atau sprint finis.",
    };
  }

  const raceDistances = [
    { name: "5K", km: 5 },
    { name: "10K", km: 10 },
    { name: "Half Marathon", km: 21.0975 },
    { name: "Marathon", km: 42.195 },
  ];

  const predictions = raceDistances.map((race) => {
    const predictedSeconds = totalSec * Math.pow(race.km / dist, 1.06);
    return {
      name: race.name,
      time: formatSecondsToTime(predictedSeconds),
    };
  });

  return { paceFormatted, speedKmh, zone, predictions };
}

export function generateSplitStrategy(distanceKm, minutes, seconds, strategy = "even") {
  const dist = parseFloat(distanceKm);
  const totalSec = parseInt(minutes || 0, 10) * 60 + parseInt(seconds || 0, 10);

  if (!dist || dist <= 0 || totalSec <= 0) return [];

  const maxSplits = Math.min(Math.ceil(dist), 43);
  const segments = [];
  let covered = 0;

  for (let i = 1; i <= maxSplits; i++) {
    const segDist = i === maxSplits ? Number((dist - covered).toFixed(2)) : 1;
    if (segDist <= 0) break;
    const midpointRatio = (covered + segDist / 2) / dist;
    segments.push({ kmLabel: i === maxSplits && segDist < 1 ? `${dist} km` : `Km ${i}`, segDist, midpointRatio });
    covered += segDist;
  }

  const basePace = totalSec / dist;
  // Negative split: mulai ~4% lebih santai di awal, tutup ~4% lebih cepat di akhir
  const rawTimes = segments.map((seg) => {
    const factor = strategy === "negative" ? 1 + 0.04 * (1 - 2 * seg.midpointRatio) : 1;
    return seg.segDist * basePace * factor;
  });

  const rawTotal = rawTimes.reduce((a, b) => a + b, 0);
  const scale = totalSec / rawTotal;

  let cumulativeSec = 0;
  return segments.map((seg, idx) => {
    const segDuration = rawTimes[idx] * scale;
    cumulativeSec += segDuration;
    const segPaceSec = segDuration / seg.segDist;
    return {
      label: seg.kmLabel,
      pace: formatPaceFromSeconds(segPaceSec),
      splitTime: formatSecondsToTime(segDuration),
      cumulative: formatSecondsToTime(cumulativeSec),
    };
  });
}