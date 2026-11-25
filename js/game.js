const copy = {
  gate: {
    time: "12:00",
    name: "Appy",
    date: "26 November",
    line: "Bahar halki baarish hai.",
    sub: "Ek minute. Mere saath chalo.",
    button: "Darwaza kholo",
  },
  rain: {
    kicker: "Neeli boondein",
    hint: "Neeli chamak pakdo. Woh tumhare naam ki hain.",
    done: "Aaj tumhari raat hai.",
    button: "Chalo",
  },
  poori: {
    kicker: "Raste mein",
    title: "Aloo poori",
    lines: [
      "Garam hai. Pehle tum.",
      "Ek aur lo na. Abhi aur garam hai.",
      "Baarish aur aloo poori — tumhara favourite.",
    ],
    tapHint: "Plate pe tap karo",
    button: "Aage chalo",
  },
  papa: {
    kicker: "Sabse badi mohabbat",
    title: "Papa",
    line: "Tum unse sabse zyada pyaar karti ho. Jo caring tum unke liye ho, wahi tumhe best banati hai.",
    button: "Aage chalo",
  },
  gift: {
    kicker: "Tumhare liye",
    title: "Ek neela dibba",
    slide: "Ribbon upar khisko",
    line: "Tumhe luxury pasand hai. Toh aaj ki raat bhi waisi hi honi chahiye.",
    sub: "Royal blue. Halki baarish. Aur tum.",
    button: "Aage chalo",
  },
  secret: {
    prompt: "Sirf tumhare liye",
    next: "Aage",
    done: "Ab khat",
    lines: [
      "Ek baat sirf main jaanta hoon.",
      "Duniya 2003 likhti hai.",
      "Main 26 November 2002 jaanta hoon.",
      "Aaj tum 24 ki ho.",
      "Yeh raaz yahin, hamare beech.",
    ],
  },
  letter: {
    date: "26 November",
    greeting: "Happy Birthday, Appy.",
    lines: [
      "Tum best ho.",
      "Meri sachchi dost.",
      "Tum itni caring ho.",
      "Tum meri luxury ho.",
      "Main tumse bahut pyaar karta hoon.",
    ],
    sign: "Gullu",
    again: "Phir se padho",
    restart: "Shuru se khelo",
  },
};

const scenes = ["gate", "rain", "poori", "papa", "gift", "secret", "letter"];
const letters = ["A", "P", "P", "Y"];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rain = createRainField();

const app = document.querySelector("#app");
const dots = document.querySelector("#dots");

scenes.forEach((name, index) => {
  const mark = document.createElement("i");
  mark.dataset.scene = name;
  if (index === 0) mark.className = "on";
  dots.append(mark);
});

document.addEventListener("pointerdown", (event) => {
  rain.ripple(event.clientX, event.clientY);
});

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(label, onClick) {
  const node = el("button", "btn", label);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

function lane(moving) {
  const node = el("div", moving ? "lane" : "lane still");
  node.innerHTML = `
    <div class="road" aria-hidden="true"></div>
    <div class="walker ${moving ? "going" : ""}" aria-hidden="true">
      <div class="umbrella">
        <div class="finial"></div>
        <div class="canopy"><i class="rib"></i></div>
        <div class="shaft"></div>
      </div>
      <div class="girl">
        <div class="hair"></div>
        <i class="lock left"></i>
        <i class="lock right"></i>
        <div class="face"><i class="smile"></i></div>
        <div class="arm"></div>
        <div class="dress"><i class="brooch"></i></div>
        <div class="leg l"></div>
        <div class="leg r"></div>
      </div>
    </div>`;
  return node;
}

function show(name) {
  const thin = name === "secret" || name === "letter";
  document.body.classList.toggle("is-thin", thin);
  rain.setMood(thin ? "thin" : "full");

  const currentIdx = scenes.indexOf(name);
  dots.querySelectorAll("i").forEach((mark, idx) => {
    mark.classList.toggle("on", idx === currentIdx);
    mark.classList.toggle("done", idx < currentIdx);
  });

  const scene = document.createElement("section");
  scene.className = "scene";
  scene.dataset.scene = name;
  builders[name](scene);
  app.replaceChildren(scene);
  app.scrollTop = 0;
  if (reduced) scene.classList.add("in");
  else requestAnimationFrame(() => scene.classList.add("in"));
}

function bindSwipe(scene, onNext) {
  let startY = null;
  scene.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || event.target.closest(".plate-wrap")) return;
    startY = event.clientY;
  });
  scene.addEventListener("pointerup", (event) => {
    if (startY == null) return;
    if (startY - event.clientY > 56) onNext();
    startY = null;
  });
}

const builders = {
  gate(scene) {
    scene.classList.add("center");
    const badge = el("div", "time-badge");
    badge.append(el("p", "time", copy.gate.time));
    scene.append(
      badge,
      el("h1", "display", copy.gate.name),
      el("p", "kicker", copy.gate.date),
      el("p", "lede", copy.gate.line),
      el("p", "sub", copy.gate.sub),
    );
    const actions = el("div", "actions");
    actions.append(button(copy.gate.button, () => show("rain")));
    scene.append(lane(false), actions);
  },

  rain(scene) {
    const kicker = el("p", "kicker", copy.rain.kicker);
    const hint = el("p", "hint", copy.rain.hint);
    const slots = letters.map(() => el("div", "slot"));
    const row = el("div", "name-slots");
    row.append(...slots);
    const play = el("div", "play");
    const walkLane = lane(true);
    play.append(walkLane);
    const actions = el("div", "actions");
    const next = button(copy.rain.button, () => show("poori"));
    next.hidden = true;
    actions.append(next);
    scene.append(kicker, hint, row, play, actions);

    let index = 0;
    let alive = true;
    let frame = 0;
    let drop = null;
    let x = 0;
    let y = 0;
    let last = 0;

    const place = () => {
      const width = play.clientWidth || 280;
      const margin = 18;
      x = margin + Math.random() * Math.max(40, width - margin * 2 - 70);
      y = reduced ? Math.max(20, play.clientHeight * 0.25) : -76;
      drop.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const finish = () => {
      alive = false;
      cancelAnimationFrame(frame);
      hint.textContent = copy.rain.done;
      walkLane.style.left = "50%";
      const rect = row.getBoundingClientRect();
      rain.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
      next.hidden = false;
    };

    const spawn = () => {
      if (!alive) return;
      drop = el("button", "drop", letters[index]);
      drop.type = "button";
      drop.setAttribute("aria-label", `Pakdo ${letters[index]}`);
      play.append(drop);
      place();
      last = performance.now();

      const tick = (now) => {
        if (!alive || reduced) return;
        const dt = Math.min(34, now - last);
        last = now;
        y += dt * 0.11;
        drop.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        if (y > play.clientHeight + 10) place();
        frame = requestAnimationFrame(tick);
      };

      drop.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (!alive) return;
        const rect = drop.getBoundingClientRect();
        rain.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14);
        const playWidth = play.clientWidth || 300;
        const targetLeft = Math.max(24, Math.min(76, ((x + 35) / playWidth) * 100));
        walkLane.style.left = `${targetLeft}%`;

        slots[index].textContent = letters[index];
        slots[index].classList.add("filled");
        drop.remove();
        cancelAnimationFrame(frame);
        index += 1;
        if (index >= letters.length) finish();
        else window.setTimeout(spawn, reduced ? 0 : 260);
      });

      if (!reduced) frame = requestAnimationFrame(tick);
    };

    spawn();
  },

  poori(scene) {
    const art = el("div", "art walk-art");
    art.innerHTML = `
      <div class="spot poori-spot">
        <div class="plate-wrap" role="button" tabindex="0" aria-label="Aloo poori taste karo">
          <div class="plate"></div>
          <div class="poori a"></div>
          <div class="poori b"></div>
          <div class="poori c"></div>
          <div class="bowl"></div>
          <div class="steam"></div>
        </div>
      </div>`;
    art.prepend(lane(true));

    const prose = el("p", "prose", copy.poori.lines[0]);
    const tapNote = el("p", "tap-note", copy.poori.tapHint);

    scene.append(
      art,
      el("p", "kicker", copy.poori.kicker),
      el("h2", "story-title", copy.poori.title),
      prose,
      tapNote,
    );

    const plateWrap = art.querySelector(".plate-wrap");
    const pooris = [...art.querySelectorAll(".poori")];
    let bites = 0;

    const taste = () => {
      if (bites < pooris.length) pooris[bites].classList.add("tasted");
      bites += 1;
      const lineIdx = Math.min(bites, copy.poori.lines.length - 1);
      prose.textContent = copy.poori.lines[lineIdx];
      tapNote.style.opacity = "0";

      plateWrap.classList.remove("bite");
      void plateWrap.offsetWidth;
      plateWrap.classList.add("bite");

      const rect = plateWrap.getBoundingClientRect();
      rain.burst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.35, 12);
    };

    plateWrap.addEventListener("click", taste);
    plateWrap.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        taste();
      }
    });

    const go = () => show("papa");
    const actions = el("div", "actions");
    actions.append(button(copy.poori.button, go));
    scene.append(actions);
    bindSwipe(scene, go);
  },

  papa(scene) {
    const art = el("div", "art walk-art");
    art.innerHTML = `
      <div class="spot papa-spot">
        <div class="window" aria-hidden="true">
          <div class="chair"></div>
          <div class="cup"></div>
          <div class="bar-v"></div>
          <div class="bar-h"></div>
        </div>
      </div>`;
    art.prepend(lane(true));
    scene.append(
      art,
      el("p", "kicker", copy.papa.kicker),
      el("h2", "story-title", copy.papa.title),
      el("p", "prose", copy.papa.line),
    );
    const go = () => show("gift");
    const actions = el("div", "actions");
    actions.append(button(copy.papa.button, go));
    scene.append(actions);
    bindSwipe(scene, go);
  },

  gift(scene) {
    const art = el("div", "art walk-art");
    const gift = el("div", "gift");
    gift.innerHTML = `
      <div class="gift-glow" aria-hidden="true"></div>
      <div class="bow" aria-hidden="true"></div>
      <div class="lid"></div>
      <div class="box"></div>
      <div class="ribbon-v"></div>`;
    const ribbon = el("div", "ribbon-h");
    ribbon.setAttribute("aria-hidden", "true");
    gift.append(ribbon);
    const spot = el("div", "spot gift-spot");
    spot.append(gift);
    art.append(lane(true), spot);

    const kicker = el("p", "kicker", copy.gift.kicker);
    const title = el("h2", "story-title", copy.gift.title);
    const actions = el("div", "actions");
    scene.append(art, kicker, title, actions);

    let opened = false;
    let dragging = false;
    let startY = 0;

    const open = () => {
      if (opened) return;
      opened = true;
      gift.classList.add("open");
      ribbon.tabIndex = -1;
      slideButton.remove();
      title.remove();
      const rect = gift.getBoundingClientRect();
      rain.burst(rect.left + rect.width / 2, rect.top + rect.height * 0.4, 26);
      scene.insertBefore(el("p", "prose", copy.gift.line), actions);
      scene.insertBefore(el("p", "sub", copy.gift.sub), actions);
      actions.append(button(copy.gift.button, () => show("secret")));
    };

    const slideButton = button(copy.gift.slide, open);
    actions.append(slideButton);

    ribbon.addEventListener("pointerdown", (event) => {
      if (opened) return;
      dragging = true;
      startY = event.clientY;
      try {
        ribbon.setPointerCapture(event.pointerId);
      } catch {
        dragging = true;
      }
    });
    ribbon.addEventListener("pointermove", (event) => {
      if (!dragging || opened) return;
      const up = Math.max(0, Math.min(120, startY - event.clientY));
      ribbon.style.transform = `translateY(${-up}px)`;
      if (up > 64) open();
    });
    const release = () => {
      dragging = false;
      if (!opened) ribbon.style.transform = "";
    };
    ribbon.addEventListener("pointerup", release);
    ribbon.addEventListener("pointercancel", release);
  },

  secret(scene) {
    scene.classList.add("center");
    const stack = el("div", "secret-stack");
    const actions = el("div", "actions");
    let step = -1;

    const nextButton = button(copy.secret.prompt, () => {
      if (step >= 0 && step === copy.secret.lines.length - 1) {
        show("letter");
        return;
      }
      step += 1;
      stack.querySelectorAll(".secret-line").forEach((line) => line.classList.add("past"));
      const line = el("p", "secret-line", copy.secret.lines[step]);
      stack.append(line);
      requestAnimationFrame(() => line.classList.add("show"));
      nextButton.textContent =
        step === copy.secret.lines.length - 1 ? copy.secret.done : copy.secret.next;
    });

    actions.append(nextButton);
    scene.append(stack, actions);
  },

  letter(scene) {
    scene.classList.add("center");
    const note = el("div", "letter");
    const greeting = el("p", "letter-line greet", copy.letter.greeting);
    greeting.dataset.line = "1";
    const rule = el("div", "letter-rule");
    rule.setAttribute("aria-hidden", "true");
    note.append(el("p", "kicker", copy.letter.date), greeting, rule);
    copy.letter.lines.forEach((text) => {
      const line = el("p", "letter-line", text);
      line.dataset.line = "1";
      note.append(line);
    });
    const sign = el("p", "sign", copy.letter.sign);
    sign.dataset.line = "1";
    note.append(sign);

    const play = () => {
      const lines = note.querySelectorAll("[data-line]");
      lines.forEach((line) => {
        line.classList.remove("show");
        line.style.transitionDelay = "0ms";
      });
      void note.offsetWidth;
      lines.forEach((line, index) => {
        line.style.transitionDelay = reduced ? "0ms" : `${index * 240}ms`;
        line.classList.add("show");
      });
      if (!reduced) {
        window.setTimeout(() => {
          const rect = note.getBoundingClientRect();
          rain.burst(rect.left + rect.width / 2, rect.top + rect.height * 0.28, 20);
        }, lines.length * 240);
      }
    };

    const actions = el("div", "actions");
    const restart = el("button", "btn-ghost", copy.letter.restart);
    restart.type = "button";
    restart.addEventListener("click", () => show("gate"));
    actions.append(button(copy.letter.again, play), restart);
    scene.append(note, actions);
    play();
  },
};

function createRainField() {
  const canvas = document.querySelector("#rain");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let mood = "full";
  let drops = [];
  let sparks = [];
  let bursts = [];
  let ripples = [];

  function makeDrop() {
    return {
      x: Math.random(),
      y: Math.random(),
      len: reduced ? 8 : 10 + Math.random() * 16,
      speed: (reduced ? 0.15 : 0.45) + Math.random() * 0.7,
      sway: (Math.random() - 0.5) * 0.4,
      bright: Math.random() > 0.8,
    };
  }

  function makeSpark() {
    return {
      x: Math.random(),
      y: Math.random(),
      r: 0.7 + Math.random() * 1.4,
      speed: 0.00012 + Math.random() * 0.00028,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.00015,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drops = Array.from({ length: reduced ? 32 : 72 }, makeDrop);
    sparks = Array.from({ length: reduced ? 8 : 18 }, makeSpark);
  }

  function paintNight() {
    const lamp = ctx.createRadialGradient(
      width * 0.5,
      height * 0.74,
      8,
      width * 0.5,
      height * 0.78,
      width * 0.52,
    );
    lamp.addColorStop(0, "rgba(243, 196, 120, 0.18)");
    lamp.addColorStop(1, "rgba(243, 196, 120, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(36, 64, 140, 0.22)";
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.9, width * 0.46, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(230, 203, 142, 0.09)";
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.915, width * 0.22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now) {
    ctx.clearRect(0, 0, width, height);
    paintNight();

    const count = mood === "thin" ? Math.floor(drops.length * 0.28) : drops.length;
    for (let i = 0; i < count; i += 1) {
      const drop = drops[i];
      const x = drop.x * width;
      const y = drop.y * height;
      ctx.strokeStyle = drop.bright ? "rgba(125, 158, 245, 0.48)" : "rgba(214, 224, 255, 0.26)";
      ctx.lineWidth = drop.bright ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + drop.sway * 8, y + drop.len);
      ctx.stroke();
      drop.y += (drop.speed * (mood === "thin" ? 0.45 : 1)) / 100;
      if (drop.y > 1.05) {
        drop.y = -0.05;
        drop.x = Math.random();
      }
    }

    const sparkCount = mood === "thin" ? Math.ceil(sparks.length * 0.55) : sparks.length;
    for (let i = 0; i < sparkCount; i += 1) {
      const spark = sparks[i];
      const twinkle = reduced ? 0.55 : 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(now / 900 + spark.phase));
      ctx.fillStyle = `rgba(230, 203, 142, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(spark.x * width, spark.y * height, spark.r, 0, Math.PI * 2);
      ctx.fill();
      if (!reduced) {
        spark.y -= spark.speed;
        spark.x += spark.drift;
        if (spark.y < -0.03) spark.y = 1.02;
        if (spark.x < -0.02 || spark.x > 1.02) spark.drift *= -1;
      }
    }

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const rp = ripples[i];
      rp.r += 1.45;
      rp.alpha *= 0.94;
      if (rp.alpha < 0.02) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(230, 203, 142, ${rp.alpha * 0.65})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const p = bursts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.025;
      p.alpha *= 0.95;
      if (p.alpha < 0.03) {
        bursts.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.gold
        ? `rgba(230, 203, 142, ${p.alpha})`
        : `rgba(128, 162, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);

  return {
    setMood(next) {
      mood = next;
    },
    ripple(x, y) {
      if (reduced) return;
      ripples.push({ x, y, r: 4, alpha: 0.7 });
    },
    burst(x, y, count = 16) {
      if (reduced) return;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 0.7 + Math.random() * 2.2;
        bursts.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          r: 1.2 + Math.random() * 2,
          alpha: 0.95,
          gold: i % 2 === 0,
        });
      }
    },
  };
}

show("gate");
