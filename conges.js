// Simulateur de congés — constantes en vigueur au 1er janvier 2026
// Sources : ameli.fr (indemnités journalières maternité/paternité), caf.fr (PreParE)
// Ces montants sont révisés chaque année : à vérifier avant toute décision.

const CONGES_CONSTANTS = {
  PMSS: 4005,           // plafond mensuel de la Sécurité sociale, 2026
  IJ_PLAFOND_JOUR: 104.02, // indemnité journalière maternité/paternité max, 2026
  ABATTEMENT: 0.21,     // 21 % (CSG/CRDS) déduits du salaire journalier de base
  JOURS_REF: 91.25,     // diviseur standard (3 mois moyens)
  NET_ESTIME_RATIO: 0.78, // approximation grossière brut -> net, à ajuster selon le statut réel

  PATERNITE_JOURS_NAISSANCE: 3, // pris en charge à 100 % par l'employeur, hors IJ

  PREPARE: {
    total: 459.70,
    miTemps: 297.17,
    partiel: 171.42,
    totalMajore: 745.45
  }
};

function calcSalaireJournalierBase(salaireBrutMensuel) {
  const c = CONGES_CONSTANTS;
  const sjbBrut = (salaireBrutMensuel * 3) / c.JOURS_REF;
  const sjbPlafond = (c.PMSS * 3) / c.JOURS_REF;
  return Math.min(sjbBrut, sjbPlafond);
}

function calcIndemniteJournaliere(salaireBrutMensuel) {
  const c = CONGES_CONSTANTS;
  const sjb = calcSalaireJournalierBase(salaireBrutMensuel);
  const ij = sjb * (1 - c.ABATTEMENT);
  return Math.min(ij, c.IJ_PLAFOND_JOUR);
}

function estimerNetMensuel(salaireBrutMensuel) {
  return salaireBrutMensuel * CONGES_CONSTANTS.NET_ESTIME_RATIO;
}

function formatEuros(n) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}
