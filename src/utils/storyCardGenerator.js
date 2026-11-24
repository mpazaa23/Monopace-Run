function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function downloadStoryCard({ paceFormatted, zoneCode, totalWeeklyKm, weeklyTarget, totalHabitChecks, sessionsDone }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  // Background Hitam Pekat Swiss Monochrome
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle Grid Lines
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 2;
  for (let x = 90; x < 1080; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1920);
    ctx.stroke();
  }

  // Outer Frame
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 72, 140, 936, 1640, 48);
  ctx.stroke();

  // Header Brand
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 132, 210, 84, 84, 20);
  ctx.fill();

  ctx.fillStyle = "#09090b";
  ctx.font = "bold 36px monospace";
  ctx.fillText("MP", 150, 265);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("MONOPACE // OS", 242, 248);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "24px monospace";
  const todayStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  ctx.fillText(`DAILY TELEMETRY • ${todayStr}`, 242, 286);

  // Zone Badge
  ctx.fillStyle = "#18181b";
  drawRoundedRect(ctx, 132, 360, 440, 58, 16);
  ctx.fill();
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#e4e4e7";
  ctx.font = "bold 24px monospace";
  ctx.fillText(zoneCode, 160, 398);

  // Hero Stat: Average Pace
  ctx.fillStyle = "#71717a";
  ctx.font = "bold 28px monospace";
  ctx.fillText("TARGET / CURRENT PACE", 132, 510);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 196px monospace";
  ctx.fillText(paceFormatted, 126, 695);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "bold 48px monospace";
  ctx.fillText("/KM", 730, 695);

  // Divider
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(132, 780);
  ctx.lineTo(948, 780);
  ctx.stroke();

  // Weekly Mileage Card
  ctx.fillStyle = "#121215";
  drawRoundedRect(ctx, 132, 840, 816, 280, 32);
  ctx.fill();
  ctx.strokeStyle = "#27272a";
  ctx.stroke();

  ctx.fillStyle = "#71717a";
  ctx.font = "bold 26px monospace";
  ctx.fillText("01 // WEEKLY MILEAGE PROGRESS", 176, 905);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 76px monospace";
  ctx.fillText(`${totalWeeklyKm.toFixed(1)} KM`, 176, 1000);

  ctx.fillStyle = "#71717a";
  ctx.font = "32px monospace";
  ctx.fillText(`/ ${weeklyTarget} KM GOAL`, 580, 1000);

  // Progress Bar
  const pct = Math.min(1, totalWeeklyKm / Math.max(1, weeklyTarget));
  ctx.fillStyle = "#27272a";
  drawRoundedRect(ctx, 176, 1042, 728, 28, 14);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 176, 1042, Math.max(28, 728 * pct), 28, 14);
  ctx.fill();

  // Bottom 2 Boxes: Habit Check-ins & Lock-In Sessions
  ctx.fillStyle = "#121215";
  drawRoundedRect(ctx, 132, 1170, 390, 290, 32);
  ctx.fill();
  ctx.strokeStyle = "#27272a";
  ctx.stroke();

  ctx.fillStyle = "#71717a";
  ctx.font = "bold 24px monospace";
  ctx.fillText("02 // HABITS", 172, 1235);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 96px monospace";
  ctx.fillText(String(totalHabitChecks), 172, 1355);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "26px sans-serif";
  ctx.fillText("Weekly Check-ins", 172, 1410);

  ctx.fillStyle = "#121215";
  drawRoundedRect(ctx, 558, 1170, 390, 290, 32);
  ctx.fill();
  ctx.strokeStyle = "#27272a";
  ctx.stroke();

  ctx.fillStyle = "#71717a";
  ctx.font = "bold 24px monospace";
  ctx.fillText("03 // LOCK-IN", 598, 1235);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 96px monospace";
  ctx.fillText(String(sessionsDone), 598, 1355);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "26px sans-serif";
  ctx.fillText("Deep Focus Sessions", 598, 1410);

  // Footer Tagline
  ctx.fillStyle = "#52525b";
  ctx.font = "24px monospace";
  ctx.fillText("RUN STEADY • LOCK IN • STAY CONSISTENT", 132, 1695);

  // Trigger Download
  const link = document.createElement("a");
  link.download = `monopace-story-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}