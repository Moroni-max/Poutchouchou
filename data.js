// Contenu de la checklist, organisé par trimestre.
// id : identifiant stable (ne pas changer, sert de clé de stockage)
// title : intitulé de la tâche
// note : détail ou contexte facultatif

const CHECKLIST_DATA = {
  1: [
    { id: "t1-test-grossesse", title: "Confirmer la grossesse avec un médecin", note: "Prise de sang + première consultation." },
    { id: "t1-declaration", title: "Déclarer la grossesse avant 14 SA", note: "CPAM et CAF, en ligne ou via le carnet de maternité." },
    { id: "t1-maternite", title: "Choisir la maternité et faire la préinscription", note: "Certaines maternités se remplissent vite, à anticiper." },
    { id: "t1-echo1", title: "Première échographie (12 SA)", note: "Datation et clarté nucale." },
    { id: "t1-mutuelle", title: "Vérifier la prise en charge par la mutuelle", note: "Frais d'hospitalisation, chambre individuelle, etc." },
    { id: "t1-sage-femme", title: "Choisir une sage-femme ou un suivi gynécologique", note: "Pour l'ensemble du suivi de grossesse." }
  ],
  2: [
    { id: "t2-echo2", title: "Deuxième échographie morphologique (22 SA)", note: "Vérification du développement du bébé." },
    { id: "t2-prenom", title: "Commencer à réfléchir au prénom", note: "Pas besoin de trancher tout de suite." },
    { id: "t2-preparation", title: "S'inscrire aux cours de préparation à l'accouchement", note: "Souvent remboursés par la Sécurité sociale." },
    { id: "t2-chambre", title: "Aménager la chambre de bébé", note: "Lit, rangements, peinture si besoin." },
    { id: "t2-liste-naissance", title: "Établir la liste de naissance", note: "À partager avec la famille et les proches." },
    { id: "t2-employeur", title: "Vérifier les droits au congé maternité / paternité", note: "Se renseigner auprès de l'employeur et de la CPAM." },
    { id: "t2-budget", title: "Faire un point budget sur l'arrivée de bébé", note: "Poussette, lit, matériel de puériculture." }
  ],
  3: [
    { id: "t3-echo3", title: "Troisième échographie (32 SA)", note: "Position du bébé, croissance." },
    { id: "t3-valise", title: "Préparer la valise de maternité", note: "Pour la mère, le bébé, et le co-parent." },
    { id: "t3-garde", title: "Choisir le mode de garde", note: "Crèche, assistante maternelle, ou garde à domicile." },
    { id: "t3-conge-dates", title: "Finaliser les dates de congé avec l'employeur", note: "Poser les dates précises de congé maternité / paternité." },
    { id: "t3-siege-auto", title: "Installer le siège auto", note: "À vérifier avant la date de terme." },
    { id: "t3-dossier-admin", title: "Rassembler le dossier administratif", note: "Livret de famille, pièce d'identité, RIB pour la CAF." },
    { id: "t3-pediatre", title: "Choisir un pédiatre ou un médecin traitant pour bébé", note: "Prendre rendez-vous pour les premières semaines." }
  ],
  4: [
    { id: "t4-mairie", title: "Déclarer la naissance à la mairie", note: "Dans les 5 jours suivant la naissance." },
    { id: "t4-caf", title: "Déclarer la naissance à la CAF", note: "Pour l'allocation de base et les droits associés." },
    { id: "t4-cpam", title: "Déclarer la naissance à la CPAM", note: "Rattachement de bébé à la sécurité sociale." },
    { id: "t4-conge-paternite", title: "Poser le congé paternité", note: "À prendre dans les 6 mois suivant la naissance." },
    { id: "t4-carnet-sante", title: "Récupérer et compléter le carnet de santé", note: "Remis à la maternité." },
    { id: "t4-mutuelle-bebe", title: "Ajouter bébé à la mutuelle", note: "Souvent à faire sous 30 jours." }
  ]
};
