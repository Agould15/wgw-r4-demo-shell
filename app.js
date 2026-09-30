(() => {
  const query = (selector) => document.querySelector(selector);
  const items = window.WGW_VIGNETTES || [];
  const body = document.body;
  const stage = query("#stage");
  const launcher = query("#launcher");
  const drawer = query("#drawer");
  const list = query("#vignetteList");
  const video = query("#video");
  const poster = query("#poster");
  const status = query("#status");
  const play = query("#playPause");
  const restart = query("#restart");
  const mute = query("#mute");
  const seek = query("#seek");
  const currentTime = query("#timeNow");
  const totalTime = query("#timeTotal");

  let controlsTimer;
  let statusTimer;
  let loadToken = 0;

  const formatTime = (seconds) => Number.isFinite(seconds)
    ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`
    : "0:00";

  function showMessage(message, duration = 3200) {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.add("show");
    statusTimer = setTimeout(() => status.classList.remove("show"), duration);
  }

  function setDrawerOpen(open) {
    if (open && !video.paused) video.pause();
    body.classList.toggle("drawer-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
  }

  function setActiveCard(id) {
    document.querySelectorAll(".vignette-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.id === id);
    });
  }

  function resetVideo() {
    loadToken += 1;
    video.oncanplay = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.style.display = "none";
    body.classList.remove("video-active");
    play.textContent = "▶";
    seek.value = "0";
    currentTime.textContent = "0:00";
    totalTime.textContent = "0:00";
  }

  function showPoster(item) {
    resetVideo();
    poster.src = item.poster;
    poster.style.display = "block";
  }

  function selectVignette(item) {
    const token = ++loadToken;
    setActiveCard(item.id);
    poster.src = item.poster;
    poster.style.display = "block";
    video.style.display = "none";
    body.classList.remove("video-active");
    video.pause();
    video.oncanplay = null;
    video.onerror = null;
    video.removeAttribute("src");
    video.load();
    setDrawerOpen(false);

    if (!item.video) {
      showMessage("Video not loaded yet");
      return;
    }

    video.oncanplay = () => {
      if (token !== loadToken) return;
      video.oncanplay = null;
      body.classList.add("video-active");
      video.style.display = "block";
    };

    video.onerror = () => {
      if (token !== loadToken) return;
      video.onerror = null;
      showPoster(item);
      showMessage("Video not loaded yet");
    };

    video.src = item.video;
    video.load();

    // Call play synchronously in the card's click handler so browser gesture
    // permissions remain active while the local video begins loading.
    const playback = video.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {
        if (token === loadToken) showMessage("Ready. Press Play to start.");
      });
    }
  }

  function togglePlayback() {
    if (!video.getAttribute("src")) {
      showMessage("Choose a vignette with a video export to play it.");
      return;
    }
    if (video.paused) {
      video.play().catch(() => showMessage("Press Play to start this vignette."));
    } else {
      video.pause();
    }
  }

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "vignette-card";
    card.dataset.id = item.id;
    card.setAttribute("aria-label", `Play ${item.title}${item.badge ? `, ${item.badge.toLowerCase()}` : ""}`);

    const topline = document.createElement("div");
    topline.className = "vignette-topline";
    const cardTitle = document.createElement("div");
    cardTitle.className = "vignette-title";
    cardTitle.textContent = item.title;
    topline.appendChild(cardTitle);

    if (item.badge) {
      const badge = document.createElement("span");
      badge.className = `badge${item.badge === "FUTURE" ? " future" : ""}`;
      badge.textContent = item.badge;
      topline.appendChild(badge);
    }

    const description = document.createElement("div");
    description.className = "vignette-desc";
    description.textContent = item.description;
    card.append(topline, description);
    card.addEventListener("click", () => selectVignette(item));
    list.appendChild(card);
  });

  launcher.addEventListener("click", () => setDrawerOpen(!body.classList.contains("drawer-open")));
  query("#closeDrawer").addEventListener("click", () => setDrawerOpen(false));
  play.addEventListener("click", togglePlayback);
  restart.addEventListener("click", () => {
    if (!video.getAttribute("src")) return;
    video.currentTime = 0;
    video.play().catch(() => showMessage("Press Play to restart this vignette."));
  });
  mute.addEventListener("click", () => {
    video.muted = !video.muted;
    mute.textContent = video.muted ? "🔇" : "🔊";
  });
  seek.addEventListener("input", () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = (Number(seek.value) / Number(seek.max)) * video.duration;
    }
  });

  video.addEventListener("play", () => { play.textContent = "❚❚"; });
  video.addEventListener("pause", () => { play.textContent = "▶"; });
  video.addEventListener("loadedmetadata", () => { totalTime.textContent = formatTime(video.duration); });
  video.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(video.currentTime);
    if (Number.isFinite(video.duration) && video.duration > 0 && document.activeElement !== seek) {
      seek.value = String(Math.round((video.currentTime / video.duration) * Number(seek.max)));
    }
  });
  video.addEventListener("ended", () => showMessage("Clip complete — holding final frame."));

  stage.addEventListener("mousemove", () => {
    stage.classList.add("controls-visible");
    clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => stage.classList.remove("controls-visible"), 1800);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName));
    if (isTyping) return;

    if (event.code === "Space") {
      if (target instanceof HTMLElement && target.closest("button") && target.id !== "playPause") return;
      event.preventDefault();
      togglePlayback();
    } else if (event.key.toLowerCase() === "r") {
      restart.click();
    } else if (event.key.toLowerCase() === "m") {
      mute.click();
    } else if (event.key === "Escape") {
      setDrawerOpen(false);
    }
  });

  if (items.length) {
    setActiveCard(items[0].id);
    kicker.textContent = "WHAT GETS WET";
    title.textContent = "Context in Action";
    poster.src = "assets/posters/regional-context.png";
    poster.alt = "Regional What Gets Wet model context";
  }
})();
