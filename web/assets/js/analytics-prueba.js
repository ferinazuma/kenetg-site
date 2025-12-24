"use strict";

(() => {
  const SEED_KEY = "kg_analytics_seed";
  const charts = {
    followers: null,
    reach: null,
    engagement: null,
    posts: null
  };

  const rangeSelect = document.getElementById("analytics-range");
  const formatSelect = document.getElementById("analytics-format");
  const regenButton = document.getElementById("analytics-regenerate");

  const summaryEls = {
    followersTotal: document.getElementById("analytics-followers-total"),
    followersDelta: document.getElementById("analytics-followers-delta"),
    reachAverage: document.getElementById("analytics-reach-average"),
    interactionsTotal: document.getElementById("analytics-interactions-total"),
    bestHour: document.getElementById("analytics-best-hour")
  };

  if (!rangeSelect || !formatSelect || !regenButton) {
    return;
  }

  let currentSeed = getSeed();

  const update = () => {
    const data = buildMockData(getRange(), getFormat(), currentSeed);
    renderSummary(data);
    updateCharts(data);
  };

  rangeSelect.addEventListener("change", update);
  formatSelect.addEventListener("change", update);
  regenButton.addEventListener("click", () => {
    currentSeed = createSeed();
    saveSeed(currentSeed);
    update();
  });

  update();

  function getRange() {
    const value = Number(rangeSelect.value);
    return Number.isFinite(value) ? value : 30;
  }

  function getFormat() {
    return formatSelect.value || "all";
  }

  function createSeed() {
    const randomPart = Math.floor(Math.random() * 1e9);
    return (Date.now() + randomPart) >>> 0;
  }

  function getSeed() {
    try {
      const stored = localStorage.getItem(SEED_KEY);
      const parsed = stored ? Number(stored) : NaN;
      if (Number.isFinite(parsed)) {
        return parsed >>> 0;
      }
    } catch {
      /* noop */
    }
    const seed = createSeed();
    saveSeed(seed);
    return seed;
  }

  function saveSeed(seed) {
    try {
      localStorage.setItem(SEED_KEY, String(seed >>> 0));
    } catch {
      /* noop */
    }
  }

  function mulberry32(seed) {
    return () => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = Math.imul(31, hash) + value.charCodeAt(i);
      hash |= 0;
    }
    return hash >>> 0;
  }

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getFormatConfig(format) {
    const configs = {
      all: { reachMultiplier: 1, engagementMultiplier: 1, postsMultiplier: 1 },
      reels: { reachMultiplier: 1.25, engagementMultiplier: 1.1, postsMultiplier: 0.7 },
      posts: { reachMultiplier: 0.95, engagementMultiplier: 0.95, postsMultiplier: 1.1 },
      stories: { reachMultiplier: 0.8, engagementMultiplier: 0.85, postsMultiplier: 1.3 }
    };
    return configs[format] || configs.all;
  }

  function splitReachByFormat(totalReach, format) {
    if (format !== "all") {
      return {
        reels: format === "reels" ? totalReach : 0,
        posts: format === "posts" ? totalReach : 0,
        stories: format === "stories" ? totalReach : 0
      };
    }
    return {
      reels: Math.round(totalReach * 0.45),
      posts: Math.round(totalReach * 0.35),
      stories: Math.round(totalReach * 0.2)
    };
  }

  function getBestHour(rng) {
    const slots = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
    return slots[Math.floor(rng() * slots.length)];
  }

  function buildMockData(rangeDays, format, seed) {
    const formatKey = format || "all";
    const combinedSeed = (seed ^ hashString(formatKey) ^ rangeDays) >>> 0;
    const rng = mulberry32(combinedSeed);
    const config = getFormatConfig(formatKey);

    const labels = [];
    const followers = [];
    const reach = [];
    const engagementRate = [];
    const postsCount = [];

    let currentFollowers = Math.round(8500 + rng() * 6000);
    let interactionsTotal = 0;

    const today = new Date();

    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(formatDate(date));

      const dayFactor = 0.85 + rng() * 0.3;
      const reachValue = Math.round((800 + rng() * 1600) * config.reachMultiplier * dayFactor);
      const engagementValue = clampNumber((3 + rng() * 9) * config.engagementMultiplier, 0.8, 12.5);
      const postsValue = Math.max(0, Math.round((1 + rng() * 3) * config.postsMultiplier));

      const followerGain = Math.max(5, Math.round((20 + rng() * 90) * config.reachMultiplier));
      currentFollowers += followerGain;

      const interactions = Math.round(
        reachValue * (engagementValue / 100) * (0.9 + rng() * 0.3)
      );
      interactionsTotal += interactions;

      followers.push(currentFollowers);
      reach.push(reachValue);
      engagementRate.push(Number(engagementValue.toFixed(2)));
      postsCount.push(postsValue);
    }

    const totalReach = reach.reduce((acc, value) => acc + value, 0);
    const reachAverage = totalReach / reach.length;
    const followersStart = followers[0] || currentFollowers;
    const followersEnd = followers[followers.length - 1] || currentFollowers;
    const followersDelta = followersStart
      ? ((followersEnd - followersStart) / followersStart) * 100
      : 0;

    return {
      labels,
      followers,
      reach,
      engagementRate,
      postsCount,
      reachByFormat: splitReachByFormat(totalReach, formatKey),
      summary: {
        followersTotal: followersEnd,
        followersDelta,
        reachAverage,
        interactionsTotal,
        bestHour: getBestHour(rng)
      }
    };
  }

  function renderSummary(data) {
    const formatter = new Intl.NumberFormat("es-ES");
    const summary = data.summary;
    const deltaSign = summary.followersDelta >= 0 ? "+" : "";

    if (summaryEls.followersTotal) {
      summaryEls.followersTotal.textContent = formatter.format(Math.round(summary.followersTotal));
    }
    if (summaryEls.followersDelta) {
      summaryEls.followersDelta.textContent = `${deltaSign}${summary.followersDelta.toFixed(1)}% vs inicio`;
    }
    if (summaryEls.reachAverage) {
      summaryEls.reachAverage.textContent = `${formatter.format(Math.round(summary.reachAverage))} / dia`;
    }
    if (summaryEls.interactionsTotal) {
      summaryEls.interactionsTotal.textContent = formatter.format(Math.round(summary.interactionsTotal));
    }
    if (summaryEls.bestHour) {
      summaryEls.bestHour.textContent = summary.bestHour;
    }
  }

  function getChartColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      neonBlue: styles.getPropertyValue("--kg-neon-blue").trim() || "#2090e0",
      neonPink: styles.getPropertyValue("--kg-neon-pink").trim() || "#f03070",
      text: styles.getPropertyValue("--kg-text").trim() || "#e5e5ff",
      textMuted: styles.getPropertyValue("--kg-text-muted").trim() || "#9a9ad0",
      grid: "rgba(255, 255, 255, 0.08)"
    };
  }

  function baseChartOptions(colors) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false }
      },
      scales: {
        x: {
          ticks: { color: colors.textMuted },
          grid: { color: colors.grid }
        },
        y: {
          ticks: { color: colors.textMuted },
          grid: { color: colors.grid }
        }
      }
    };
  }

  function renderCharts(data) {
    if (!window.Chart) {
      return;
    }

    destroyCharts();

    const colors = getChartColors();
    const options = baseChartOptions(colors);

    const followersCtx = document.getElementById("analytics-followers-chart");
    const reachCtx = document.getElementById("analytics-reach-chart");
    const engagementCtx = document.getElementById("analytics-engagement-chart");
    const postsCtx = document.getElementById("analytics-posts-chart");

    if (followersCtx) {
      charts.followers = new Chart(followersCtx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Seguidores",
              data: data.followers,
              borderColor: colors.neonBlue,
              borderWidth: 2,
              pointRadius: 2,
              tension: 0.3,
              fill: false
            }
          ]
        },
        options
      });
    }

    if (reachCtx) {
      charts.reach = new Chart(reachCtx, {
        type: "bar",
        data: {
          labels: ["Reels", "Posts", "Stories"],
          datasets: [
            {
              label: "Alcance",
              data: [
                data.reachByFormat.reels,
                data.reachByFormat.posts,
                data.reachByFormat.stories
              ],
              backgroundColor: colors.neonBlue
            }
          ]
        },
        options
      });
    }

    if (engagementCtx) {
      charts.engagement = new Chart(engagementCtx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Engagement rate (%)",
              data: data.engagementRate,
              borderColor: colors.neonPink,
              borderWidth: 2,
              pointRadius: 2,
              tension: 0.3,
              fill: false
            }
          ]
        },
        options
      });
    }

    if (postsCtx) {
      charts.posts = new Chart(postsCtx, {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Publicaciones",
              data: data.postsCount,
              backgroundColor: colors.neonPink
            }
          ]
        },
        options
      });
    }
  }

  function updateCharts(data) {
    if (!window.Chart) {
      return;
    }

    if (!charts.followers || !charts.reach || !charts.engagement || !charts.posts) {
      renderCharts(data);
      return;
    }

    charts.followers.data.labels = data.labels;
    charts.followers.data.datasets[0].data = data.followers;
    charts.followers.update();

    charts.reach.data.datasets[0].data = [
      data.reachByFormat.reels,
      data.reachByFormat.posts,
      data.reachByFormat.stories
    ];
    charts.reach.update();

    charts.engagement.data.labels = data.labels;
    charts.engagement.data.datasets[0].data = data.engagementRate;
    charts.engagement.update();

    charts.posts.data.labels = data.labels;
    charts.posts.data.datasets[0].data = data.postsCount;
    charts.posts.update();
  }

  function destroyCharts() {
    Object.keys(charts).forEach((key) => {
      const chart = charts[key];
      if (chart && typeof chart.destroy === "function") {
        chart.destroy();
      }
      charts[key] = null;
    });
  }
})();
