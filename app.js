(function () {
  "use strict";

  /* ---- Settings: fill these in once the services exist ---- */
  var CONFIG = {
    // Free key from https://web3forms.com (sent to izak@idktech.co.za). Leave empty until you have it.
    WEB3FORMS_KEY: "",
    // Your booking page, e.g. https://cal.com/izak-idk/30min. Empty = the Book button opens WhatsApp.
    BOOKING_URL: "",
    WHATSAPP: "27825528523",
    EMAIL: "izak@idktech.co.za"
  };

  var site = document.getElementById("site");

  /* ---------- language ---------- */
  function readLang() {
    try { var v = localStorage.getItem("idk-lang"); if (v === "en" || v === "af") return v; } catch (e) {}
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("af") === 0 ? "af" : "en";
  }
  function setLang(lang) {
    site.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lang ? "true" : "false");
    });
    document.querySelectorAll("[data-ph-" + lang + "]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-ph-" + lang));
    });
    document.querySelectorAll("option[data-" + lang + "]").forEach(function (o) {
      o.textContent = o.getAttribute("data-" + lang);
    });
    try { localStorage.setItem("idk-lang", lang); } catch (e) {}
  }
  document.querySelectorAll("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
  });
  setLang(readLang());

  function msg(en, af) {
    return '<span class="en">' + en + '</span><span class="af">' + af + "</span>";
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var nav = document.getElementById("nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- "Ask for a quote" preselects the topic ---------- */
  var topic = document.getElementById("cf-topic");
  document.querySelectorAll("[data-topic]").forEach(function (a) {
    a.addEventListener("click", function () { topic.value = a.getAttribute("data-topic"); });
  });

  /* ---------- copy email ---------- */
  var copyBtn = document.getElementById("copy-email");
  copyBtn.addEventListener("click", function () {
    var done = function () {
      copyBtn.innerHTML = msg("Copied", "Gekopieer");
      setTimeout(function () { copyBtn.innerHTML = msg("Copy", "Kopieer"); }, 1800);
    };
    var fallback = function () {
      var r = document.createRange();
      r.selectNodeContents(document.getElementById("email-value"));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    try {
      navigator.clipboard.writeText(CONFIG.EMAIL).then(done, fallback);
    } catch (e) { fallback(); }
  });

  /* ---------- booking ---------- */
  var book = document.getElementById("book-call");
  if (CONFIG.BOOKING_URL) {
    book.href = CONFIG.BOOKING_URL;
  } else {
    book.href = "https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent("Hi Izak, I'd like to book a call about IDK Tech.");
  }

  /* ---------- forms ---------- */
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function send(payload, note, button, onOk) {
    if (!CONFIG.WEB3FORMS_KEY) {
      note.className = "form-note warn";
      note.innerHTML = msg(
        "The form isn't connected yet. Email " + CONFIG.EMAIL + " or WhatsApp 082 552 8523 instead.",
        "Die vorm is nog nie gekoppel nie. E-pos eerder " + CONFIG.EMAIL + " of WhatsApp 082 552 8523."
      );
      return;
    }
    payload.access_key = CONFIG.WEB3FORMS_KEY;
    button.disabled = true;
    note.className = "form-note";
    note.innerHTML = msg("Sending…", "Stuur tans…");
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success) { note.className = "form-note ok"; onOk(); }
        else { throw new Error("rejected"); }
      })
      .catch(function () {
        note.className = "form-note warn";
        note.innerHTML = msg(
          "That didn't go through. Please email " + CONFIG.EMAIL + " directly.",
          "Dit het nie deurgegaan nie. E-pos asseblief direk na " + CONFIG.EMAIL + "."
        );
      })
      .then(function () { button.disabled = false; });
  }

  var wl = document.getElementById("waitlist-form");
  wl.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("waitlist-email").value.trim();
    var note = document.getElementById("waitlist-note");
    if (wl.botcheck.value) return;
    if (!validEmail(email)) {
      note.className = "form-note warn";
      note.innerHTML = msg("Enter a valid email address, like name@example.com.", "Tik 'n geldige e-posadres in, soos naam@voorbeeld.co.za.");
      return;
    }
    send({ subject: "VOLTTRACK waitlist", email: email, from_name: "idktech.co.za" }, note, document.getElementById("waitlist-submit"), function () {
      note.innerHTML = msg("You're on the list. We'll email you when the first batch is ready.", "Jy is op die lys. Ons e-pos jou wanneer die eerste bondel gereed is.");
      wl.reset();
    });
  });

  var cf = document.getElementById("contact-form");
  cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var note = document.getElementById("contact-note");
    if (cf.botcheck.value) return;
    var name = document.getElementById("cf-name").value.trim(), email = document.getElementById("cf-email").value.trim(), message = document.getElementById("cf-message").value.trim();
    if (!name || !validEmail(email) || !message) {
      note.className = "form-note warn";
      note.innerHTML = msg("Fill in your name, a valid email and a message.", "Vul jou naam, 'n geldige e-pos en 'n boodskap in.");
      return;
    }
    var topicText = topic.options[topic.selectedIndex].getAttribute("data-en");
    send({ subject: "IDK Tech: " + topicText, name: name, email: email, topic: topicText, message: message, from_name: "idktech.co.za" },
      note, document.getElementById("cf-submit"), function () {
        note.innerHTML = msg("Message sent. Izak will get back to you.", "Boodskap gestuur. Izak sal na jou terugkom.");
        cf.reset();
      });
  });

  /* ---------- FarmDiesel example screen: the litre counter runs ---------- */
  var counter = document.getElementById("diesel-counter");
  var still = false;
  try { still = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (counter && !still) {
    var litres = 142.6;
    setInterval(function () {
      litres += 0.3 + Math.random() * 0.2;
      if (litres > 480) litres = 12.4;
      counter.textContent = litres.toFixed(1);
    }, 400);
  }

  /* ---------- reveal on scroll (no-JS and reduced-motion both show everything) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (!still && "IntersectionObserver" in window && revealEls.length) {
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // safety net: anything still hidden after 3 s is shown
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add("in"); }); }, 3000);
  }

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
