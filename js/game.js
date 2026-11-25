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
    line: "Garam hai. Pehle tum.",
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

  dots.querySelectorAll("i").forEach((mark) => {
    mark.classList.toggle("on", mark.dataset.scene === name);
  });

  const scene = document.createElement("section");
  scene.className = "scene";
  scene.dataset.scene = name;
  builders[name](scene);
  app.replaceChildren(scene);
  if (reduced) scene.classList.add("in");
  else requestAnimationFrame(() => scene.classList.add("in"));
}

function bindSwipe(scene, onNext) {
  let startY = null;
  scene.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
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
    scene.append(
      el("p", "time", copy.gate.time),
      el("h1", "display", copy.gate.name),
      el("p", "kicker", copy.gate.date),
      el("p", "lede", copy.gate.line),
      el("p", "sub", copy.gate.sub),
    );
    const actions = el("div", "actions");
    actions.append(
      button(copy.gate.button, () => show("rain")),
    );
    scene.append(lane(false), actions);
  },

  rain(scene) {
    const kicker = el("p", "kicker", copy.rain.kicker);
    const hint = el("p", "hint", copy.rain.hint);
    const slots = letters.map(() => el("div", "slot"));
    const row = el("div", "name-slots");
    row.append(...slots);
    const play = el("div", "play");
    play.append(lane(true));
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
      const margin = 16;
      x = margin + Math.random() * Math.max(40, width - margin * 2 - 68);
      y = reduced ? Math.max(24, play.clientHeight * 0.34) : -76;
      drop.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const finish = () => {
      alive = false;
      cancelAnimationFrame(frame);
      hint.textContent = copy.rain.done;
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
        <div class="plate-wrap" aria-hidden="true">
          <div class="plate"></div>
          <div class="poori a"></div>
          <div class="poori b"></div>
          <div class="poori c"></div>
          <div class="bowl"></div>
          <div class="steam"></div>
        </div>
      </div>`;
    art.prepend(lane(true));
    scene.append(
      art,
      el("p", "kicker", copy.poori.kicker),
      el("h2", "story-title", copy.poori.title),
      el("p", "prose", copy.poori.line),
    );
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
    note.append(el("p", "kicker", copy.letter.date), greeting);
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
        line.style.transitionDelay = reduced ? "0ms" : `${index * 260}ms`;
        line.classList.add("show");
      });
    };

    const actions = el("div", "actions");
    actions.append(button(copy.letter.again, play));
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

  function makeDrop() {
    return {
      x: Math.random(),
      y: Math.random(),
      len: reduced ? 8 : 10 + Math.random() * 16,
      speed: (reduced ? 0.15 : 0.45) + Math.random() * 0.7,
      sway: (Math.random() - 0.5) * 0.4,
      bright: Math.random() > 0.82,
    };
  }

  function makeSpark() {
    return {
      x: Math.random(),
      y: Math.random(),
      r: 0.7 + Math.random() * 1.3,
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
    drops = Array.from({ length: reduced ? 32 : 70 }, makeDrop);
    sparks = Array.from({ length: reduced ? 8 : 16 }, makeSpark);
  }

  function paintNight() {
    const lamp = ctx.createRadialGradient(width * 0.5, height * 0.74, 8, width * 0.5, height * 0.78, width * 0.48);
    lamp.addColorStop(0, "rgba(243, 196, 120, 0.18)");
    lamp.addColorStop(1, "rgba(243, 196, 120, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(36, 64, 140, 0.22)";
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.9, width * 0.46, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(228, 201, 138, 0.08)";
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
      ctx.strokeStyle = drop.bright ? "rgba(125, 158, 245, 0.45)" : "rgba(214, 224, 255, 0.28)";
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

    const sparkCount = mood === "thin" ? Math.ceil(sparks.length * 0.45) : sparks.length;
    for (let i = 0; i < sparkCount; i += 1) {
      const spark = sparks[i];
      const twinkle = reduced ? 0.55 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now / 900 + spark.phase));
      ctx.fillStyle = `rgba(228, 201, 138, ${twinkle})`;
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
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);

  return {
    setMood(next) {
      mood = next;
    },
  };
}

show("gate");
