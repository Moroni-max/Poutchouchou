(function () {
  "use strict";

  const DUE_KEY = "cdv_dueDate";
  const CODE_KEY = "cdv_familyCode";
  const CUSTOM_KEY = "cdv_customItems";
  const HIDDEN_KEY = "cdv_hiddenBase";
  const WEEKS_TOTAL = 40;

  const el = (id) => document.getElementById(id);
  const setupPanel = el("setupPanel");
  const progressSummary = el("progressSummary");
  const mainContent = el("mainContent");
  const syncBanner = el("syncBanner");
  const familyCodeDisplay = el("familyCodeDisplay");

  let state = {
    dueDate: localStorage.getItem(DUE_KEY) || null,
    familyCode: localStorage.getItem(CODE_KEY) || null,
    completed: {}, // { itemId: true }
    customItems: JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"), // [{id, trimester, title, note}]
    hiddenBaseIds: JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]") // ids d'étapes prédéfinies supprimées
  };

  let db = null;
  let docRef = null;
  let unsubscribe = null;

  // ----------------------------------------------------------
  // Firebase (optionnel) : si non configuré, on reste en local
  // ----------------------------------------------------------
  function initFirebase() {
    if (typeof FIREBASE_CONFIGURED === "undefined" || !FIREBASE_CONFIGURED) {
      showBanner("Mode local uniquement — configure Firebase (voir README) pour synchroniser entre vos appareils.");
      return false;
    }
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      db.enablePersistence().catch((err) => {
        // "failed-precondition" = plusieurs onglets ouverts, "unimplemented" = navigateur non compatible.
        // Dans ces cas, l'appli continue de fonctionner, juste sans ce filet de sécurité hors-ligne.
        console.warn("Persistance hors-ligne non activée :", err.code);
      });
      return true;
    } catch (e) {
      console.error("Erreur d'initialisation Firebase :", e);
      showBanner("Connexion au carnet partagé impossible — les données restent enregistrées sur cet appareil uniquement.");
      return false;
    }
  }

  function showBanner(msg) {
    syncBanner.textContent = msg;
    syncBanner.hidden = false;
  }
  function hideBanner() {
    syncBanner.hidden = true;
  }

  function sanitizeCode(code) {
    return code
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_]/g, "");
  }

  function connectToDoc() {
    if (!db || !state.familyCode) return;
    docRef = db.collection("carnets-voyage").doc(state.familyCode);

    if (unsubscribe) unsubscribe();
    unsubscribe = docRef.onSnapshot(
      (snap) => {
        if (!snap.exists) {
          // Premier appareil à utiliser ce code : on initialise le document.
          docRef.set({
            dueDate: state.dueDate,
            completed: state.completed,
            customItems: state.customItems,
            hiddenBaseIds: state.hiddenBaseIds,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          return;
        }
        const data = snap.data();
        if (data.dueDate && data.dueDate !== state.dueDate) {
          state.dueDate = data.dueDate;
          localStorage.setItem(DUE_KEY, state.dueDate);
        }
        state.completed = data.completed || {};
        state.customItems = data.customItems || [];
        state.hiddenBaseIds = data.hiddenBaseIds || [];
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.customItems));
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(state.hiddenBaseIds));
        renderAll();
        hideBanner();
      },
      (err) => {
        console.error("Erreur de synchronisation :", err);
        showBanner("Synchronisation interrompue — vérifiez votre connexion.");
      }
    );
  }

  function pushToCloud() {
    if (!docRef) return;
    docRef.set(
      {
        dueDate: state.dueDate,
        completed: state.completed,
        customItems: state.customItems,
        hiddenBaseIds: state.hiddenBaseIds,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }

  // ----------------------------------------------------------
  // Calcul de semaine de grossesse
  // ----------------------------------------------------------
  function currentWeek() {
    if (!state.dueDate) return null;
    const due = new Date(state.dueDate + "T00:00:00");
    const today = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksUntilDue = Math.round((due - today) / msPerWeek);
    const week = WEEKS_TOTAL - weeksUntilDue;
    return Math.min(Math.max(week, 0), WEEKS_TOTAL);
  }

  // ----------------------------------------------------------
  // Rendu de l'itinéraire SVG
  // ----------------------------------------------------------
  const TRIMESTER_BOUNDS = { 1: 13, 2: 27, 3: 40, 4: 44 };

  function renderRoute() {
    const week = currentWeek();
    if (week === null) return;

    el("weekNumber").textContent = week >= WEEKS_TOTAL ? "40+" : week;

    const path = el("routePathDone");
    const fullPath = el("routePath");
    const total = fullPath.getTotalLength();
    const ratio = Math.min(week / WEEKS_TOTAL, 1);
    path.setAttribute("stroke-dasharray", `${total * ratio} ${total}`);

    // Marqueur du voyageur : position actuelle sur le tracé
    const point = fullPath.getPointAtLength(total * ratio);
    const marker = el("travelerMarker");
    marker.setAttribute("transform", `translate(${point.x}, ${point.y})`);

    // Jalons de trimestre
    const waypointsGroup = el("waypoints");
    waypointsGroup.innerHTML = "";
    Object.entries(TRIMESTER_BOUNDS).forEach(([tri, weekEnd]) => {
      if (tri === "4") return; // pas de jalon visuel pour le post-partum
      const r = Math.min(weekEnd / WEEKS_TOTAL, 1);
      const p = fullPath.getPointAtLength(total * r);
      const done = week >= weekEnd;
      const ns = "http://www.w3.org/2000/svg";
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", p.x);
      circle.setAttribute("cy", p.y);
      circle.setAttribute("r", 7);
      circle.setAttribute("class", "waypoint-dot");
      circle.setAttribute("fill", done ? "#6E8462" : "#F4EBD5");
      waypointsGroup.appendChild(circle);

      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", p.x);
      label.setAttribute("y", p.y - 14);
      label.setAttribute("class", "waypoint-label");
      label.textContent = "T" + tri;
      waypointsGroup.appendChild(label);
    });
  }

  // ----------------------------------------------------------
  // Rendu de la checklist
  // ----------------------------------------------------------
  function itemsForTrimester(tri) {
    const base = (CHECKLIST_DATA[tri] || []).filter((i) => !state.hiddenBaseIds.includes(i.id));
    const custom = state.customItems.filter((c) => String(c.trimester) === String(tri));
    return base.concat(custom);
  }

  function allItems() {
    return Object.keys(CHECKLIST_DATA)
      .map((tri) => itemsForTrimester(tri))
      .flat();
  }

  function renderChecklists() {
    Object.keys(CHECKLIST_DATA).forEach((tri) => {
      const list = el("checklist-" + tri);
      list.innerHTML = "";
      itemsForTrimester(tri).forEach((item) => {
        const tpl = el("checklistItemTemplate").content.cloneNode(true);
        const li = tpl.querySelector(".checklist-item");
        const btn = tpl.querySelector(".check-btn");
        const title = tpl.querySelector(".item-title");
        const note = tpl.querySelector(".item-note");
        const deleteBtn = tpl.querySelector(".delete-btn");

        title.textContent = item.title;
        note.textContent = item.note || "";
        btn.dataset.id = item.id;

        const isDone = !!state.completed[item.id];
        btn.setAttribute("aria-pressed", String(isDone));
        if (isDone) li.classList.add("is-done");

        btn.addEventListener("click", () => toggleItem(item.id, btn, li));

        deleteBtn.hidden = false;
        deleteBtn.addEventListener("click", () => {
          if (item.custom) {
            deleteCustomItem(item.id);
          } else {
            deleteBaseItem(item.id);
          }
        });

        list.appendChild(tpl);
      });

      renderAddForm(tri, list);
    });
  }

  function renderAddForm(tri, list) {
    const wrapper = document.createElement("li");
    wrapper.className = "add-item-row";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "btn-add-step";
    toggleBtn.textContent = "+ Ajouter une étape";

    const form = document.createElement("div");
    form.className = "add-item-form";
    form.hidden = true;
    form.innerHTML = `
      <input type="text" class="add-item-title" placeholder="Intitulé de l'étape" maxlength="120" />
      <input type="text" class="add-item-note" placeholder="Détail (facultatif)" maxlength="200" />
      <div class="add-item-actions">
        <button type="button" class="btn-ghost add-item-cancel">Annuler</button>
        <button type="button" class="btn-primary add-item-confirm">Ajouter</button>
      </div>
    `;

    toggleBtn.addEventListener("click", () => {
      form.hidden = false;
      toggleBtn.hidden = true;
      form.querySelector(".add-item-title").focus();
    });

    form.querySelector(".add-item-cancel").addEventListener("click", () => {
      form.hidden = true;
      toggleBtn.hidden = false;
    });

    form.querySelector(".add-item-confirm").addEventListener("click", () => {
      const titleInput = form.querySelector(".add-item-title");
      const noteInput = form.querySelector(".add-item-note");
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        return;
      }
      addCustomItem(tri, title, noteInput.value.trim());
      form.hidden = true;
      toggleBtn.hidden = false;
      titleInput.value = "";
      noteInput.value = "";
    });

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(form);
    list.appendChild(wrapper);
  }

  function saveCustomItems() {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.customItems));
  }

  function saveHiddenBase() {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(state.hiddenBaseIds));
  }

  function deleteBaseItem(id) {
    if (!window.confirm("Supprimer cette étape de votre checklist ? Vous pourrez la retrouver en réinitialisant votre carnet.")) {
      return;
    }
    state.hiddenBaseIds.push(id);
    delete state.completed[id];
    saveHiddenBase();
    renderChecklists();
    renderProgress();
    pushToCloud();
  }

  function addCustomItem(trimester, title, note) {
    const id = "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    state.customItems.push({ id, trimester: String(trimester), title, note, custom: true });
    saveCustomItems();
    renderChecklists();
    renderProgress();
    pushToCloud();
  }

  function deleteCustomItem(id) {
    state.customItems = state.customItems.filter((c) => c.id !== id);
    delete state.completed[id];
    saveCustomItems();
    renderChecklists();
    renderProgress();
    pushToCloud();
  }

  function toggleItem(id, btn, li) {
    const nowDone = !state.completed[id];
    if (nowDone) {
      state.completed[id] = true;
      btn.classList.add("is-stamping");
      setTimeout(() => btn.classList.remove("is-stamping"), 400);
    } else {
      delete state.completed[id];
    }
    btn.setAttribute("aria-pressed", String(nowDone));
    li.classList.toggle("is-done", nowDone);
    renderProgress();
    pushToCloud();
  }

  function renderProgress() {
    const items = allItems();
    const doneCount = items.filter((i) => state.completed[i.id]).length;
    const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
    el("overallProgressFill").style.width = pct + "%";
    el("overallProgressLabel").textContent = pct + " % préparé";
  }

  function renderAll() {
    renderRoute();
    renderChecklists();
    renderProgress();
    renderPostcard();
    familyCodeDisplay.textContent = state.familyCode || "—";
  }

  // ----------------------------------------------------------
  // Carte postale de la semaine
  // ----------------------------------------------------------
  function produceIconSVG(shape, color, scale) {
    const c = `var(--${color})`;
    const s = Math.max(1, Math.min(10, scale));
    const r = 10 + s * 3.2; // rayon/half-size en fonction de l'échelle
    const cx = 50, cy = 56;

    const stem = `<path d="M ${cx - 3} ${cy - r + 4} Q ${cx} ${cy - r - 10} ${cx + 7} ${cy - r - 6}" fill="none" stroke="var(--sage)" stroke-width="3" stroke-linecap="round"/>`;

    let body = "";
    switch (shape) {
      case "seed":
        body = `<circle cx="${cx}" cy="${cy}" r="${Math.max(3, r * 0.35)}" fill="${c}"/>`;
        return `<svg viewBox="0 0 100 100">${body}</svg>`;
      case "berry":
        body = `
          <circle cx="${cx - r * 0.4}" cy="${cy + r * 0.3}" r="${r * 0.55}" fill="${c}"/>
          <circle cx="${cx + r * 0.45}" cy="${cy + r * 0.15}" r="${r * 0.5}" fill="${c}"/>
          <circle cx="${cx}" cy="${cy - r * 0.45}" r="${r * 0.5}" fill="${c}"/>`;
        return `<svg viewBox="0 0 100 100">${body}${stem}</svg>`;
      case "round-small":
      case "round-medium":
        body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
        return `<svg viewBox="0 0 100 100">${body}${stem}</svg>`;
      case "oval":
        body = `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.8}" ry="${r * 1.05}" fill="${c}"/>`;
        return `<svg viewBox="0 0 100 100">${body}${stem}</svg>`;
      case "elongated":
        body = `<rect x="${cx - r}" y="${cy - r * 0.5}" width="${r * 2}" height="${r}" rx="${r * 0.5}" fill="${c}" transform="rotate(-18 ${cx} ${cy})"/>`;
        return `<svg viewBox="0 0 100 100">${body}</svg>`;
      case "leafy": {
        const leaf1 = `<ellipse cx="${cx - r * 0.5}" cy="${cy - r * 0.7}" rx="${r * 0.45}" ry="${r * 0.3}" fill="var(--sage)" transform="rotate(-30 ${cx - r * 0.5} ${cy - r * 0.7})"/>`;
        const leaf2 = `<ellipse cx="${cx + r * 0.5}" cy="${cy - r * 0.7}" rx="${r * 0.45}" ry="${r * 0.3}" fill="var(--sage)" transform="rotate(30 ${cx + r * 0.5} ${cy - r * 0.7})"/>`;
        body = `<circle cx="${cx}" cy="${cy + r * 0.1}" r="${r * 0.85}" fill="${c}"/>`;
        return `<svg viewBox="0 0 100 100">${leaf1}${leaf2}${body}</svg>`;
      }
      case "large-round": {
        const lines = [-0.5, 0, 0.5].map(
          (o) => `<path d="M ${cx + o * r * 0.6} ${cy - r * 0.9} Q ${cx + o * r * 1.1} ${cy} ${cx + o * r * 0.6} ${cy + r * 0.9}" fill="none" stroke="rgba(27,42,74,0.18)" stroke-width="2"/>`
        ).join("");
        body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>${lines}`;
        return `<svg viewBox="0 0 100 100">${body}${stem}</svg>`;
      }
      case "large-oval": {
        const lines = [-0.5, 0, 0.5].map(
          (o) => `<path d="M ${cx + o * r * 0.7} ${cy - r} Q ${cx + o * r * 1.2} ${cy} ${cx + o * r * 0.7} ${cy + r}" fill="none" stroke="rgba(27,42,74,0.18)" stroke-width="2"/>`
        ).join("");
        body = `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.8}" fill="${c}"/>${lines}`;
        return `<svg viewBox="0 0 100 100">${body}</svg>`;
      }
      default:
        body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
        return `<svg viewBox="0 0 100 100">${body}</svg>`;
    }
  }

  function renderPostcard() {
    const week = currentWeek();
    if (week === null) return;
    const entry = WEEKLY_DATA[Math.max(4, Math.min(40, week))];
    if (!entry) return;

    el("postcardWeekLabel").textContent = "semaine " + week;
    el("postcardSizeName").textContent = entry.name;
    el("postcardNote").textContent = entry.text;
    el("postcardIcon").innerHTML = produceIconSVG(entry.shape, entry.color, entry.scale);
    el("postcardStamp").textContent = "SA " + week;
  }

  // ----------------------------------------------------------
  // Démarrage / configuration
  // ----------------------------------------------------------
  function showApp() {
    setupPanel.hidden = true;
    progressSummary.hidden = false;
    mainContent.hidden = false;
    el("appFooter").hidden = false;
    renderAll();
  }

  el("startTripBtn").addEventListener("click", () => {
    const due = el("dueDateInput").value;
    const code = sanitizeCode(el("setupFamilyCode").value || "");
    if (!due || !code) {
      alert("Merci de renseigner la date de terme et le code du voyage.");
      return;
    }
    state.dueDate = due;
    state.familyCode = code;
    localStorage.setItem(DUE_KEY, due);
    localStorage.setItem(CODE_KEY, code);
    showApp();
    if (db) connectToDoc();
  });

  el("editDueDateBtn").addEventListener("click", () => {
    progressSummary.hidden = true;
    mainContent.hidden = true;
    el("appFooter").hidden = true;
    setupPanel.hidden = false;
    el("dueDateInput").value = state.dueDate || "";
    el("setupFamilyCode").value = state.familyCode || "";
  });

  // Modale changement de code
  const codeModal = el("codeModal");
  el("changeCodeBtn").addEventListener("click", () => {
    el("familyCodeInput").value = state.familyCode || "";
    codeModal.hidden = false;
  });
  el("cancelCodeBtn").addEventListener("click", () => (codeModal.hidden = true));
  el("confirmCodeBtn").addEventListener("click", () => {
    const code = sanitizeCode(el("familyCodeInput").value || "");
    if (!code) return;
    state.familyCode = code;
    localStorage.setItem(CODE_KEY, code);
    codeModal.hidden = true;
    familyCodeDisplay.textContent = code;
    if (db) connectToDoc();
  });

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  const firebaseReady = initFirebase();

  if (state.dueDate && state.familyCode) {
    showApp();
    if (firebaseReady) connectToDoc();
  } else {
    el("dueDateInput").value = state.dueDate || "";
    el("setupFamilyCode").value = state.familyCode || "";
  }

  window.addEventListener("resize", renderRoute);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW non enregistré :", e));
    });
  }
})();
