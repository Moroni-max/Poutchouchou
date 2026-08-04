(function () {
  "use strict";

  const DUE_KEY = "cdv_dueDate";
  const CODE_KEY = "cdv_familyCode";
  const CUSTOM_KEY = "cdv_customItems";
  const HIDDEN_KEY = "cdv_hiddenBase";
  const JOURNAL_KEY = "cdv_journal";
  const JOURNAL_AUTHOR_KEY = "cdv_journalAuthor";
  const BUDGET_CUSTOM_KEY = "cdv_budgetCustom";
  const BUDGET_HIDDEN_KEY = "cdv_budgetHidden";
  const BUDGET_VALUES_KEY = "cdv_budgetValues";
  const WEEKS_TOTAL = 40;

  const MOOD_OPTIONS = [
    { id: "heureux",  emoji: "😊", label: "Heureux·se" },
    { id: "fatigue",  emoji: "😴", label: "Fatigué·e" },
    { id: "nauseeux", emoji: "🤢", label: "Nauséeux·se" },
    { id: "attendri", emoji: "🥰", label: "Attendri·e" },
    { id: "stresse",  emoji: "😰", label: "Stressé·e" },
    { id: "excite",   emoji: "🤩", label: "Excité·e" }
  ];

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
    hiddenBaseIds: JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"), // ids d'étapes prédéfinies supprimées
    journalEntries: JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]"), // [{id, date, author, mood, text}]
    budgetCustomItems: JSON.parse(localStorage.getItem(BUDGET_CUSTOM_KEY) || "[]"), // [{id, category, name, prevu}]
    budgetHiddenIds: JSON.parse(localStorage.getItem(BUDGET_HIDDEN_KEY) || "[]"), // ids d'articles prédéfinis supprimés
    budgetValues: JSON.parse(localStorage.getItem(BUDGET_VALUES_KEY) || "{}") // { itemId: { prevu, reel } }
  };

  let db = null;
  let docRef = null;
  let unsubscribe = null;
  let pendingLocalWrites = 0;
  let hasSyncedOnce = false;

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
    } catch (e) {
      console.error("Erreur d'initialisation Firebase :", e);
      showBanner("Connexion au carnet partagé impossible — les données restent enregistrées sur cet appareil uniquement.");
      return false;
    }
    try {
      db.enablePersistence().catch((err) => {
        // "failed-precondition" = plusieurs onglets ouverts, "unimplemented" = navigateur non compatible.
        // Dans ces cas, l'appli continue de fonctionner, juste sans ce filet de sécurité hors-ligne.
        console.warn("Persistance hors-ligne non activée :", err.code);
      });
    } catch (err) {
      console.warn("Persistance hors-ligne non disponible sur ce navigateur :", err);
    }
    return true;
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
    hasSyncedOnce = false;

    if (unsubscribe) unsubscribe();
    unsubscribe = docRef.onSnapshot(
      (snap) => {
        if (!snap.exists) {
          // Premier appareil à utiliser ce code : on initialise le document.
          hasSyncedOnce = true;
          docRef.set({
            dueDate: state.dueDate,
            completed: state.completed,
            customItems: state.customItems,
            hiddenBaseIds: state.hiddenBaseIds,
            journalEntries: state.journalEntries,
            budgetCustomItems: state.budgetCustomItems,
            budgetHiddenIds: state.budgetHiddenIds,
            budgetValues: state.budgetValues,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          return;
        }
        const data = snap.data();
        hasSyncedOnce = true;
        if (pendingLocalWrites > 0) {
          // Une écriture locale est en cours : on ne laisse pas un ancien
          // instantané venir écraser un changement qu'on vient de faire.
          return;
        }
        if (data.dueDate && data.dueDate !== state.dueDate) {
          state.dueDate = data.dueDate;
          localStorage.setItem(DUE_KEY, state.dueDate);
        }
        state.completed = data.completed || {};
        state.customItems = data.customItems || [];
        state.hiddenBaseIds = data.hiddenBaseIds || [];
        state.journalEntries = data.journalEntries || [];
        state.budgetCustomItems = data.budgetCustomItems || [];
        state.budgetHiddenIds = data.budgetHiddenIds || [];
        state.budgetValues = data.budgetValues || {};
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.customItems));
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(state.hiddenBaseIds));
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(state.journalEntries));
        localStorage.setItem(BUDGET_CUSTOM_KEY, JSON.stringify(state.budgetCustomItems));
        localStorage.setItem(BUDGET_HIDDEN_KEY, JSON.stringify(state.budgetHiddenIds));
        localStorage.setItem(BUDGET_VALUES_KEY, JSON.stringify(state.budgetValues));
        renderAll();
        hideBanner();
      },
      (err) => {
        console.error("Erreur de synchronisation :", err);
        showBanner("Synchronisation interrompue — vérifiez votre connexion.");
      }
    );
  }

  function pushDueDateOnly() {
    if (!docRef) return;
    // Écriture volontairement limitée au seul champ dueDate : contrairement à
    // pushToCloud(), elle ne peut jamais écraser completed/customItems/journal/budget,
    // même si cet appareil n'a pas encore reçu l'état complet du serveur.
    docRef.set(
      { dueDate: state.dueDate, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  function pushToCloud() {
    if (!docRef || !hasSyncedOnce) return;
    pendingLocalWrites++;
    docRef
      .set({
        dueDate: state.dueDate,
        completed: state.completed,
        customItems: state.customItems,
        hiddenBaseIds: state.hiddenBaseIds,
        journalEntries: state.journalEntries,
        budgetCustomItems: state.budgetCustomItems,
        budgetHiddenIds: state.budgetHiddenIds,
        budgetValues: state.budgetValues,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch((err) => {
        console.error("Erreur d'écriture Firestore :", err);
      })
      .finally(() => {
        pendingLocalWrites = Math.max(0, pendingLocalWrites - 1);
      });
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
      circle.setAttribute("fill", done ? "#6B8566" : "#FBF6E8");
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
      itemsForTrimester(tri).forEach((item, index) => {
        const tpl = el("checklistItemTemplate").content.cloneNode(true);
        const li = tpl.querySelector(".checklist-item");
        const btn = tpl.querySelector(".check-btn");
        const title = tpl.querySelector(".item-title");
        const note = tpl.querySelector(".item-note");
        const deleteBtn = tpl.querySelector(".delete-btn");

        li.style.animationDelay = Math.min(index * 35, 350) + "ms";
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

  // ----------------------------------------------------------
  // Journal de ressenti
  // ----------------------------------------------------------
  let selectedAuthor = localStorage.getItem(JOURNAL_AUTHOR_KEY) || null;
  let selectedMood = null;

  function setupJournalForm() {
    const moodRow = el("journalMoodRow");
    MOOD_OPTIONS.forEach((mood) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mood-btn";
      btn.setAttribute("aria-pressed", "false");
      btn.title = mood.label;
      btn.textContent = mood.emoji;
      btn.dataset.moodId = mood.id;
      btn.addEventListener("click", () => {
        const alreadySelected = btn.getAttribute("aria-pressed") === "true";
        moodRow.querySelectorAll(".mood-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
        selectedMood = alreadySelected ? null : mood.id;
        if (!alreadySelected) btn.setAttribute("aria-pressed", "true");
      });
      moodRow.appendChild(btn);
    });

    const authorToggle = el("journalAuthorToggle");
    authorToggle.querySelectorAll(".author-btn").forEach((btn) => {
      if (btn.dataset.author === selectedAuthor) btn.setAttribute("aria-pressed", "true");
      btn.addEventListener("click", () => {
        authorToggle.querySelectorAll(".author-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        selectedAuthor = btn.dataset.author;
        localStorage.setItem(JOURNAL_AUTHOR_KEY, selectedAuthor);
      });
    });

    el("journalSubmitBtn").addEventListener("click", () => {
      const textarea = el("journalText");
      const text = textarea.value.trim();
      if (!text) {
        textarea.focus();
        return;
      }
      if (!selectedAuthor) {
        alert("Merci d'indiquer qui écrit cette note.");
        return;
      }
      addJournalEntry(selectedAuthor, selectedMood, text);
      textarea.value = "";
      selectedMood = null;
      moodRow.querySelectorAll(".mood-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
    });
  }

  function saveJournalEntries() {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(state.journalEntries));
  }

  function addJournalEntry(author, moodId, text) {
    const entry = {
      id: "journal-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      author,
      mood: moodId,
      text
    };
    state.journalEntries.unshift(entry);
    saveJournalEntries();
    renderJournal();
    pushToCloud();
  }

  function deleteJournalEntry(id) {
    state.journalEntries = state.journalEntries.filter((e) => e.id !== id);
    saveJournalEntries();
    renderJournal();
    pushToCloud();
  }

  function formatJournalDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function renderJournal() {
    const list = el("journalList");
    list.innerHTML = "";

    if (!state.journalEntries.length) {
      list.classList.remove("journal-list-timeline");
      const empty = document.createElement("li");
      empty.className = "journal-empty";
      empty.textContent = "Aucune note pour l'instant — le premier ressenti du jour vous attend.";
      list.appendChild(empty);
      return;
    }
    list.classList.add("journal-list-timeline");

    const sorted = state.journalEntries.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach((entry, index) => {
      const tpl = el("journalEntryTemplate").content.cloneNode(true);
      const li = tpl.querySelector(".journal-entry");
      const authorEl = tpl.querySelector(".journal-entry-author");
      const moodEl = tpl.querySelector(".journal-entry-mood");
      const dateEl = tpl.querySelector(".journal-entry-date");
      const textEl = tpl.querySelector(".journal-entry-text");
      const deleteBtn = tpl.querySelector(".journal-entry-delete");

      li.classList.add(entry.author === "papa" ? "author-papa" : "author-maman");
      li.style.animationDelay = Math.min(index * 45, 350) + "ms";
      authorEl.textContent = entry.author === "papa" ? "Papa" : "Maman";
      const moodDef = MOOD_OPTIONS.find((m) => m.id === entry.mood);
      moodEl.textContent = moodDef ? moodDef.emoji : "";
      moodEl.title = moodDef ? moodDef.label : "";
      dateEl.textContent = formatJournalDate(entry.date);
      textEl.textContent = entry.text;
      deleteBtn.addEventListener("click", () => deleteJournalEntry(entry.id));

      list.appendChild(tpl);
    });
  }

  function renderAll() {
    renderRoute();
    renderChecklists();
    renderProgress();
    renderPostcard();
    renderJournal();
    renderBudget();
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
    if (db) {
      connectToDoc();
      pushDueDateOnly();
    }
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
  // Simulateur de congés
  // ----------------------------------------------------------
  function setupCongesSimulator() {
    const matInputs = [el("matSalaire"), el("matDuree"), el("matSubrogation")];
    const patInputs = [el("patSalaire"), el("patType"), el("patSubrogation")];
    const parInputs = [el("parNiveau"), el("parMajore")];

    matInputs.forEach((input) => input.addEventListener("input", renderMaternite));
    patInputs.forEach((input) => input.addEventListener("input", renderPaternite));
    parInputs.forEach((input) => input.addEventListener("input", renderParental));

    renderParental(); // pas besoin de salaire, peut s'afficher tout de suite
  }

  function renderMaternite() {
    const result = el("matResult");
    const salaire = parseFloat(el("matSalaire").value);
    if (!salaire || salaire <= 0) {
      result.hidden = true;
      return;
    }
    const semaines = parseInt(el("matDuree").value, 10);
    const joursTotal = semaines * 7;
    const subrogation = el("matSubrogation").checked;

    const ij = calcIndemniteJournaliere(salaire);
    const totalIJ = ij * joursTotal;
    const moisApprox = semaines / 4.33;
    const totalIJMensuel = totalIJ / moisApprox;
    const netHabituel = estimerNetMensuel(salaire);

    result.hidden = false;
    if (subrogation) {
      result.innerHTML = `
        <p class="conges-result-headline">Salaire net maintenu : <strong>${formatEuros(netHabituel)}</strong> / mois</p>
        <p class="conges-result-line">Votre employeur vous maintient votre salaire net habituel pendant les <strong>${semaines} semaines</strong> (${joursTotal} jours) de congé, puis se fait rembourser les indemnités journalières par la CPAM (~${formatEuros(ij)}/jour, soit environ ${formatEuros(totalIJ)} au total sur la période).</p>
      `;
    } else {
      result.innerHTML = `
        <p class="conges-result-headline">Indemnités CPAM estimées : <strong>${formatEuros(totalIJMensuel)}</strong> / mois</p>
        <p class="conges-result-line">Soit environ <strong>${formatEuros(ij)}</strong> par jour, pour un total d'environ <strong>${formatEuros(totalIJ)}</strong> sur les ${semaines} semaines (${joursTotal} jours) de congé.</p>
        <p class="conges-result-line">À titre de comparaison, votre salaire net habituel est estimé à environ ${formatEuros(netHabituel)} / mois — l'écart peut être réduit si votre convention collective prévoit un complément employeur.</p>
      `;
    }
  }

  function renderPaternite() {
    const result = el("patResult");
    const salaire = parseFloat(el("patSalaire").value);
    if (!salaire || salaire <= 0) {
      result.hidden = true;
      return;
    }
    const joursTotal = parseInt(el("patType").value, 10);
    const joursNaissance = CONGES_CONSTANTS.PATERNITE_JOURS_NAISSANCE;
    const joursIndemnises = joursTotal - joursNaissance;
    const subrogation = el("patSubrogation").checked;

    const ij = calcIndemniteJournaliere(salaire);
    const totalIJ = ij * joursIndemnises;
    const netHabituel = estimerNetMensuel(salaire);
    const netJournalier = netHabituel / 30;
    const naissancePaye = netJournalier * joursNaissance;

    result.hidden = false;
    if (subrogation) {
      result.innerHTML = `
        <p class="conges-result-headline">Salaire net maintenu tout du long : <strong>~${formatEuros(netJournalier)}</strong> / jour</p>
        <p class="conges-result-line">Les ${joursNaissance} premiers jours (congé de naissance) sont déjà payés à 100 % par l'employeur. Pour les ${joursIndemnises} jours suivants, votre employeur maintient votre net et se fait rembourser environ ${formatEuros(ij)}/jour par la CPAM (${formatEuros(totalIJ)} au total).</p>
      `;
    } else {
      result.innerHTML = `
        <p class="conges-result-headline">Indemnités CPAM estimées : <strong>${formatEuros(totalIJ)}</strong> au total</p>
        <p class="conges-result-line">Les <strong>${joursNaissance} premiers jours</strong> (congé de naissance) sont payés à 100 % par l'employeur, soit environ ${formatEuros(naissancePaye)}.</p>
        <p class="conges-result-line">Les <strong>${joursIndemnises} jours</strong> suivants de congé paternité sont indemnisés par la CPAM à environ <strong>${formatEuros(ij)}</strong>/jour, soit ${formatEuros(totalIJ)} au total — sur les ${joursTotal} jours de congé.</p>
      `;
    }
  }

  function renderParental() {
    const result = el("parResult");
    const niveau = el("parNiveau").value;
    const majore = el("parMajore").checked;
    const p = CONGES_CONSTANTS.PREPARE;

    let montant, dureeNote;
    if (niveau === "total") {
      montant = majore ? p.totalMajore : p.total;
      dureeNote = "Durée : 6 mois par parent pour un 1er enfant ; jusqu'aux 3 ans de l'enfant à partir du 2e (avec majoration si 3 enfants ou plus).";
    } else if (niveau === "mi-temps") {
      montant = p.miTemps;
      dureeNote = "Montant réduit pour un temps partiel jusqu'à 50 % — la majoration ne s'applique qu'à l'arrêt total.";
    } else {
      montant = p.partiel;
      dureeNote = "Montant réduit pour un temps partiel entre 50 % et 80 % — la majoration ne s'applique qu'à l'arrêt total.";
    }

    result.hidden = false;
    result.innerHTML = `
      <p class="conges-result-headline">PreParE estimée : <strong>${formatEuros(montant)}</strong> / mois</p>
      <p class="conges-result-line">${dureeNote}</p>
      <p class="conges-result-line">Versée par la CAF, sans lien avec votre salaire — les deux parents peuvent la percevoir en même temps, mais le total est alors plafonné au montant à taux plein.</p>
    `;
  }

  // ----------------------------------------------------------
  // Budget arrivée bébé
  // ----------------------------------------------------------
  function budgetItemsForCategory(catKey) {
    const base = (BUDGET_DATA[catKey].items || []).filter((i) => !state.budgetHiddenIds.includes(i.id));
    const custom = state.budgetCustomItems.filter((c) => c.category === catKey);
    return base.concat(custom);
  }

  function budgetAllItems() {
    return Object.keys(BUDGET_DATA).map((cat) => budgetItemsForCategory(cat)).flat();
  }

  function getBudgetValue(item) {
    const override = state.budgetValues[item.id];
    return {
      prevu: override && override.prevu !== undefined && override.prevu !== null ? override.prevu : item.prevu,
      reel: override && override.reel !== undefined && override.reel !== null ? override.reel : null
    };
  }

  function setBudgetValue(itemId, field, value) {
    if (!state.budgetValues[itemId]) state.budgetValues[itemId] = {};
    state.budgetValues[itemId][field] = value === "" ? null : parseFloat(value);
    localStorage.setItem(BUDGET_VALUES_KEY, JSON.stringify(state.budgetValues));
    renderBudgetSummary();
    pushToCloud();
  }

  const BUDGET_ICONS = {
    transport: '<path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.5h7.2A2 2 0 0 1 17.5 11L19 16"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 16h14"/>',
    chambre: '<path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18v2M21 18v2"/><path d="M3 13V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/>',
    quotidien: '<path d="M10 2h4M10 2v3l-2 2v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7l-2-2V2"/><path d="M8 12h8"/>',
    vetements: '<path d="M8 4l4 2 4-2 4 4-3 3v11H7V11L4 8z"/>',
    divers: '<path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3z"/>'
  };

  function buildBudgetCategoriesDom() {
    const container = el("budgetCategories");
    container.innerHTML = "";
    Object.keys(BUDGET_DATA).forEach((catKey) => {
      const section = document.createElement("section");
      section.className = "budget-section";
      section.dataset.category = catKey;

      const iconSvg = BUDGET_ICONS[catKey] || "";
      section.innerHTML = `
        <h2 class="section-h2">
          <button type="button" class="section-header" aria-expanded="true">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
            ${BUDGET_DATA[catKey].label}
            <svg class="section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </h2>
        <div class="category-gauge" id="gauge-${catKey}">
          <div class="category-gauge-track"><div class="category-gauge-fill"></div></div>
          <span class="category-gauge-label">—</span>
        </div>
        <div class="section-body">
          <div class="section-body-inner">
            <ul class="budget-list" id="budget-list-${catKey}"></ul>
          </div>
        </div>
      `;

      container.appendChild(section);
    });
  }

  function renderBudgetCategoryGauge(catKey) {
    const gauge = el("gauge-" + catKey);
    if (!gauge) return;
    const items = budgetItemsForCategory(catKey);
    let prevu = 0, reel = 0;
    items.forEach((item) => {
      const v = getBudgetValue(item);
      prevu += v.prevu || 0;
      if (v.reel !== null) reel += v.reel;
    });
    const pct = prevu > 0 ? Math.min(100, Math.round((reel / prevu) * 100)) : 0;
    gauge.querySelector(".category-gauge-fill").style.width = pct + "%";
    gauge.querySelector(".category-gauge-label").textContent = `${formatEuros(reel)} / ${formatEuros(prevu)}`;
  }

  function renderBudgetCategory(catKey) {
    const list = el("budget-list-" + catKey);
    if (!list) return;
    list.innerHTML = "";

    budgetItemsForCategory(catKey).forEach((item, index) => {
      const tpl = el("budgetItemTemplate").content.cloneNode(true);
      const li = tpl.querySelector(".budget-item");
      const nameEl = tpl.querySelector(".budget-item-name");
      const prevuInput = tpl.querySelector(".budget-prevu-input");
      const reelInput = tpl.querySelector(".budget-reel-input");
      const deleteBtn = tpl.querySelector(".budget-delete");

      li.style.animationDelay = Math.min(index * 35, 350) + "ms";
      const values = getBudgetValue(item);
      nameEl.textContent = item.name;
      prevuInput.value = values.prevu;
      reelInput.value = values.reel === null ? "" : values.reel;
      if (values.reel !== null) li.classList.add("is-achete");

      prevuInput.addEventListener("change", () => {
        setBudgetValue(item.id, "prevu", prevuInput.value);
        renderBudgetCategoryGauge(catKey);
      });
      reelInput.addEventListener("change", () => {
        setBudgetValue(item.id, "reel", reelInput.value);
        li.classList.toggle("is-achete", reelInput.value !== "");
        renderBudgetCategoryGauge(catKey);
      });

      deleteBtn.hidden = false;
      deleteBtn.addEventListener("click", () => {
        if (item.custom) {
          deleteBudgetCustomItem(item.id);
        } else {
          deleteBudgetBaseItem(item.id);
        }
      });

      list.appendChild(tpl);
    });

    renderBudgetAddForm(catKey, list);
    renderBudgetCategoryGauge(catKey);
  }

  function renderBudgetAddForm(catKey, list) {
    const wrapper = document.createElement("li");
    wrapper.className = "add-item-row";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "btn-add-step";
    toggleBtn.textContent = "+ Ajouter un article";

    const form = document.createElement("div");
    form.className = "add-item-form";
    form.hidden = true;
    form.innerHTML = `
      <input type="text" class="add-item-title" placeholder="Nom de l'article" maxlength="80" />
      <input type="number" class="add-item-prevu" placeholder="Budget prévu (€)" min="0" step="5" />
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
      const prevuInput = form.querySelector(".add-item-prevu");
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        return;
      }
      const prevu = parseFloat(prevuInput.value) || 0;
      addBudgetCustomItem(catKey, title, prevu);
      form.hidden = true;
      toggleBtn.hidden = false;
      titleInput.value = "";
      prevuInput.value = "";
    });

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(form);
    list.appendChild(wrapper);
  }

  function saveBudgetCustomItems() {
    localStorage.setItem(BUDGET_CUSTOM_KEY, JSON.stringify(state.budgetCustomItems));
  }
  function saveBudgetHiddenIds() {
    localStorage.setItem(BUDGET_HIDDEN_KEY, JSON.stringify(state.budgetHiddenIds));
  }

  function addBudgetCustomItem(category, name, prevu) {
    const id = "budget-custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    state.budgetCustomItems.push({ id, category, name, prevu, custom: true });
    saveBudgetCustomItems();
    renderBudgetCategory(category);
    renderBudgetSummary();
    pushToCloud();
  }

  function deleteBudgetCustomItem(id) {
    const item = state.budgetCustomItems.find((c) => c.id === id);
    state.budgetCustomItems = state.budgetCustomItems.filter((c) => c.id !== id);
    delete state.budgetValues[id];
    saveBudgetCustomItems();
    if (item) renderBudgetCategory(item.category);
    renderBudgetSummary();
    pushToCloud();
  }

  function deleteBudgetBaseItem(id) {
    if (!window.confirm("Supprimer cet article du budget ?")) return;
    let category = null;
    Object.keys(BUDGET_DATA).forEach((cat) => {
      if (BUDGET_DATA[cat].items.some((i) => i.id === id)) category = cat;
    });
    state.budgetHiddenIds.push(id);
    delete state.budgetValues[id];
    saveBudgetHiddenIds();
    if (category) renderBudgetCategory(category);
    renderBudgetSummary();
    pushToCloud();
  }

  function renderBudgetSummary() {
    const items = budgetAllItems();
    let totalPrevu = 0, totalReel = 0, resteAPrevoir = 0, achetes = 0;
    items.forEach((item) => {
      const v = getBudgetValue(item);
      totalPrevu += v.prevu || 0;
      if (v.reel !== null) {
        totalReel += v.reel;
        achetes++;
      } else {
        resteAPrevoir += v.prevu || 0;
      }
    });
    el("budgetTotalPrevu").textContent = formatEuros(totalPrevu);
    el("budgetTotalReel").textContent = formatEuros(totalReel);
    el("budgetReste").textContent = formatEuros(resteAPrevoir);
    const pct = items.length ? Math.round((achetes / items.length) * 100) : 0;
    el("budgetProgressFill").style.width = pct + "%";
    el("budgetProgressLabel").textContent = pct + " % des articles achetés";
  }

  function renderBudget() {
    if (!el("budgetCategories").children.length) {
      buildBudgetCategoriesDom();
    }
    Object.keys(BUDGET_DATA).forEach((catKey) => renderBudgetCategory(catKey));
    renderBudgetSummary();
  }

  // ----------------------------------------------------------
  // Accordéons de section
  // ----------------------------------------------------------
  function setupAccordions() {
    document.addEventListener("click", (e) => {
      const header = e.target.closest(".section-header");
      if (!header) return;
      const expanded = header.getAttribute("aria-expanded") !== "false";
      header.setAttribute("aria-expanded", String(!expanded));
    });
  }

  // ----------------------------------------------------------
  // Onglets
  // ----------------------------------------------------------
  function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        tabButtons.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.hidden = panel.dataset.tabPanel !== target;
        });
      });
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  setupTabs();
  setupAccordions();
  setupJournalForm();
  setupCongesSimulator();
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
