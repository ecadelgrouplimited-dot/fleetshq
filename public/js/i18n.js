/* ── FLEETS.HQ public-site translations ──────────────────────────────────
 * Client-side i18n for the marketing pages only (welcome, about, services,
 * contact, track). The authenticated dashboard is intentionally not
 * covered — internal panels stay English-only.
 *
 * Usage: mark up text with data-i18n="key" (swaps textContent),
 * data-i18n-html="key" (swaps innerHTML — only for the handful of strings
 * that need embedded markup like <br>/<b>), or data-i18n-attr="placeholder"
 * alongside data-i18n="key" to translate an attribute instead of the node's
 * content. All translation strings below are developer-authored (never
 * end-user input), so innerHTML use is safe.
 */
(function () {
  var STRINGS = {
    en: {
      'brand.tagline': 'The operating system for transport companies',
      'aria.toggleTheme': 'Toggle theme',
      'aria.toggleLanguage': 'Change language',
      'aria.brandHome': 'FLEETS.HQ home',
      'aria.showPassword': 'Show password',
      'aria.hidePassword': 'Hide password',

      'welcome.hero.headline': 'One Platform.<br>Total <span class="accent">Control.</span>',
      'welcome.hero.sub': 'Drivers, vehicles, compliance, tachographs and maintenance — everything your transport operation needs, in one connected platform.',
      'pillar.drivers': 'Drivers',
      'pillar.vehicles': 'Vehicles',
      'pillar.compliance': 'Compliance',
      'pillar.tachographs': 'Tachographs',
      'pillar.maintenance': 'Maintenance',
      'welcome.tagline': '<b>Built by hauliers.</b> For hauliers.',
      'stat.domains.l': 'Operating domains',
      'stat.dvsa.l': 'Audit-ready',
      'stat.uk.l': 'Hosted &amp; GDPR-aligned',
      'stat.monitoring.l': 'Compliance monitoring',

      'form.eyebrow': 'Secure access',
      'form.title': 'Welcome back',
      'form.subtitle': 'Sign in to your FLEETS.HQ dashboard.',
      'form.emailLabel': 'Email address',
      'form.passwordLabel': 'Password',
      'form.remember': 'Remember me',
      'form.forgot': 'Forgot password?',
      'form.submit': 'Sign in to dashboard',
      'form.submitting': 'Signing in…',
      'form.trust': 'Encrypted session · JWT authenticated · UK-hosted',
      'form.registerPrompt': 'New here?',
      'form.registerLink': 'Register your company',

      'footer.trust': 'Enterprise-grade security. Your data is protected, encrypted in transit and at rest, on UK-hosted infrastructure.',
      'footer.poweredBy': 'Powered by',
      'footer.contact': 'Contact',
      'footer.track': 'Track a shipment',
      'footer.privacy': 'Privacy',

      'nav.track': 'Track',
      'nav.contact': 'Contact',
      'nav.getStarted': 'Get started',
      'nav.signIn': 'Sign in',
      'nav.getQuote': 'Get a quote',

      'home.hero.title': 'One Platform. Total Control<span class="grad">.</span>',
      'home.hero.sub': 'The operating system for transport companies. Drivers, vehicles, compliance, tachographs and maintenance — one connected platform that keeps every mile accountable.',
      'contact.hero.title': 'Talk to the transport team<span class="grad">.</span>',
      'contact.hero.sub': 'Send a quote request, partnership enquiry, or service question — it lands straight in the operations hub.',
      'track.hero.title': 'Track a shipment<span class="grad">.</span>',
      'track.hero.sub': 'Check a reference for live status, ETA and milestone history — no account needed.',

      'hero.requestQuote': 'Request a quote',
      'hero.trackShipment': 'Track a shipment',
      'metric.domains': 'operating domains',
      'metric.dvsa': 'audit-ready',
      'metric.monitoring': 'real-time monitoring',

      'chip.audit': 'Audit readiness 98%',
      'chip.auditSub': 'People · Fleet · Driver',
      'chip.live': 'Live monitoring',
      'chip.liveSub': 'fleet-wide · real time',

      'pillars.drivers.desc': 'Licences, CPC, training &amp; more',
      'pillars.vehicles.desc': 'Maintenance, inspections, MOT &amp; defects',
      'pillars.compliance.desc': 'DVSA, Home Office, audits &amp; docs',
      'pillars.tachographs.desc': 'Digital analysis, alerts &amp; downloads',
      'pillars.maintenance.desc': 'Workshops, PMI, scheduling &amp; costs',

      'builtby.gold': 'Built by hauliers. For hauliers.',
      'builtby.white': 'One platform. Total control.',

      'band.oneSystem.kicker': 'One connected system',
      'band.oneSystem.title': 'Move, prove, improve — without the spreadsheets.',
      'band.oneSystem.sub': 'Customer booking, dispatch, driver delivery, fleet maintenance, HR, finance and compliance stop being separate tools. They become one source of truth.',
      'card.deliver.title': 'Deliver',
      'card.deliver.desc': 'Same-day, next-day, scheduled and multi-drop movements — booked by customers, allocated by dispatch, run by drivers with proof of delivery.',
      'card.prove.title': 'Prove',
      'card.prove.desc': 'Every check, defect, document and training record becomes DVSA and Home-Office audit evidence — assembled in one click when an inspector knocks.',
      'card.improve.title': 'Improve',
      'card.improve.desc': 'A live compliance score and cross-domain KPIs show exactly where you stand — and where the next risk is, before it costs you.',

      'card.shippers.title': 'For shippers',
      'card.shippers.desc': 'Request a quote, book a collection, track a parcel and download proof of delivery — without needing an account to get started.',
      'card.shippers.link': 'See services →',
      'card.operators.title': 'For operators',
      'card.operators.desc': 'Run dispatch, fleet, people, finance and compliance from one tenant-aware platform — with role-based panels for every team.',
      'card.operators.link': 'Enter the platform →',


      'trust.security.title': 'Enterprise-grade security.',
      'trust.security.desc': 'Your data is protected, encrypted in transit and at rest, on UK-hosted infrastructure.',
      'trust.powered': 'Powered by',


      'contact.form.kicker': 'Get in touch',
      'contact.form.title': 'Send an enquiry.',
      'contact.form.sub': 'Quotes, service questions, partnerships or support — it lands straight in the operations queue.',

      'footer.tagline': 'The operating system for transport companies — drivers, vehicles, compliance, tachographs and maintenance in one connected platform.',
      'footer.platformHeading': 'Platform',
      'footer.legalHeading': 'Legal',
      'footer.partnerships': 'Partnerships',

      'stats2.rolePanels': 'Connected role panels',
      'stats2.domainsOnePlatform': 'Operating domains, one platform',
      'stats2.auditPacks': 'DVSA audit evidence packs',
      'stats2.realTimeMonitoring': 'Real-time monitoring',


      'contact.info.emailLabel': 'Email',
      'contact.info.hoursLabel': 'Hours',
      'contact.info.hoursValue': 'Mon–Fri · 08:00–18:00',
      'contact.info.urgentLabel': 'Urgent work',
      'contact.info.urgentValue': 'Submit any time — visible in intake',
      'contact.form.nameLabel': 'Name',
      'contact.form.emailLabel': 'Email',
      'contact.form.phoneLabel': 'Phone',
      'contact.form.companyLabel': 'Company',
      'contact.form.typeLabel': 'Enquiry type',
      'contact.form.type.quote': 'Quote request',
      'contact.form.type.service': 'Service question',
      'contact.form.type.tracking': 'Tracking support',
      'contact.form.type.partnership': 'Partnership',
      'contact.form.type.general': 'General enquiry',
      'contact.form.messageLabel': 'Message',
      'contact.form.submit': 'Send enquiry',
      'contact.form.successNotice': "Thanks — your enquiry has been received. We'll be in touch shortly.",

      'track.form.refLabel': 'Tracking reference',
      'track.form.refPlaceholder': 'e.g. 256-LANE-042',
      'track.form.submit': 'Check status',
      'track.help': 'Enter a reference for live status, ETA and milestone history. Need help?',
      'track.help.contactDesk': 'Contact the desk',
      'track.empty.awaitingRef': 'Awaiting reference',
      'track.empty.readyToTrack': 'Ready to track',
      'track.empty.liveTracking': 'Live tracking',
      'track.empty.statusLabel': 'Status',
      'track.empty.statusValue': 'Enter a reference',
      'track.empty.milestonesLabel': 'Milestones',
      'track.empty.milestonesValue': 'Preview enabled',
      'track.empty.supportLabel': 'Support',
      'track.empty.contactDesk': 'Contact desk',
      'track.empty.notice': 'Enter a public reference to preview status, ETA, vehicle slot and shipment milestones.',
      'track.result.refLabel': 'Tracking reference',
      'track.result.collection': 'Collection',
      'track.result.delivery': 'Delivery',
      'track.result.serviceLabel': 'Service',
      'track.result.etaLabel': 'ETA window',
      'track.result.vehicleLabel': 'Vehicle slot',
      'track.result.nextAction': 'Next action:',

      'footer.ukOps': 'UK logistics operations',
      'footer.signatureWork': 'A signature work by',
    },

    fr: {
      'brand.tagline': "Le système d'exploitation pour les entreprises de transport",
      'aria.toggleTheme': 'Changer de thème',
      'aria.toggleLanguage': 'Changer de langue',
      'aria.brandHome': 'Accueil FLEETS.HQ',
      'aria.showPassword': 'Afficher le mot de passe',
      'aria.hidePassword': 'Masquer le mot de passe',

      'welcome.hero.headline': 'Une plateforme.<br>Contrôle <span class="accent">total.</span>',
      'welcome.hero.sub': 'Chauffeurs, véhicules, conformité, tachygraphes et maintenance — tout ce dont votre exploitation de transport a besoin, sur une seule plateforme connectée.',
      'pillar.drivers': 'Chauffeurs',
      'pillar.vehicles': 'Véhicules',
      'pillar.compliance': 'Conformité',
      'pillar.tachographs': 'Tachygraphes',
      'pillar.maintenance': 'Maintenance',
      'welcome.tagline': '<b>Conçu par des transporteurs.</b> Pour les transporteurs.',
      'stat.domains.l': "Domaines d'exploitation",
      'stat.dvsa.l': 'Prêt pour l\'audit',
      'stat.uk.l': 'Hébergé au Royaume-Uni, conforme RGPD',
      'stat.monitoring.l': 'Surveillance de la conformité',

      'form.eyebrow': 'Accès sécurisé',
      'form.title': 'Bon retour',
      'form.subtitle': 'Connectez-vous à votre tableau de bord FLEETS.HQ.',
      'form.emailLabel': 'Adresse e-mail',
      'form.passwordLabel': 'Mot de passe',
      'form.remember': 'Se souvenir de moi',
      'form.forgot': 'Mot de passe oublié ?',
      'form.submit': 'Se connecter au tableau de bord',
      'form.submitting': 'Connexion…',
      'form.trust': 'Session chiffrée · authentification JWT · hébergé au Royaume-Uni',
      'form.registerPrompt': 'Nouveau ici ?',
      'form.registerLink': 'Inscrivez votre entreprise',

      'footer.trust': "Sécurité de niveau professionnel. Vos données sont protégées, chiffrées en transit et au repos, sur une infrastructure hébergée au Royaume-Uni.",
      'footer.poweredBy': 'Propulsé par',
      'footer.contact': 'Contact',
      'footer.track': 'Suivre un envoi',
      'footer.privacy': 'Confidentialité',

      'nav.track': 'Suivi',
      'nav.contact': 'Contact',
      'nav.getStarted': 'Commencer',
      'nav.signIn': 'Se connecter',
      'nav.getQuote': 'Obtenir un devis',

      'home.hero.title': 'Une plateforme. Contrôle total<span class="grad">.</span>',
      'home.hero.sub': "Le système d'exploitation pour les entreprises de transport. Chauffeurs, véhicules, conformité, tachygraphes et maintenance — une plateforme connectée qui rend chaque kilomètre traçable.",
      'contact.hero.title': 'Parlez à l\'équipe transport<span class="grad">.</span>',
      'contact.hero.sub': "Envoyez une demande de devis, une demande de partenariat ou une question sur nos services — elle arrive directement au centre des opérations.",
      'track.hero.title': 'Suivre un envoi<span class="grad">.</span>',
      'track.hero.sub': "Vérifiez une référence pour le statut en direct, l'heure d'arrivée estimée et l'historique des étapes — sans compte requis.",

      'hero.requestQuote': 'Demander un devis',
      'hero.trackShipment': 'Suivre un envoi',
      'metric.domains': "domaines d'exploitation",
      'metric.dvsa': "prêt pour l'audit",
      'metric.monitoring': 'surveillance en temps réel',

      'chip.audit': "Préparation à l'audit 98 %",
      'chip.auditSub': 'Personnel · Flotte · Chauffeur',
      'chip.live': 'Surveillance en direct',
      'chip.liveSub': 'toute la flotte · temps réel',

      'pillars.drivers.desc': 'Permis, CPC, formation et plus',
      'pillars.vehicles.desc': 'Maintenance, inspections, contrôle technique et défauts',
      'pillars.compliance.desc': 'DVSA, Home Office, audits et documents',
      'pillars.tachographs.desc': 'Analyse numérique, alertes et téléchargements',
      'pillars.maintenance.desc': 'Ateliers, PMI, planification et coûts',

      'builtby.gold': 'Conçu par des transporteurs. Pour les transporteurs.',
      'builtby.white': 'Une plateforme. Contrôle total.',

      'band.oneSystem.kicker': 'Un système connecté',
      'band.oneSystem.title': 'Bouger, prouver, améliorer — sans tableurs.',
      'band.oneSystem.sub': "Réservation client, répartition, livraison chauffeur, maintenance de flotte, RH, finance et conformité cessent d'être des outils séparés. Ils deviennent une seule source de vérité.",
      'card.deliver.title': 'Livrer',
      'card.deliver.desc': 'Mouvements jour même, lendemain, planifiés et multi-arrêts — réservés par les clients, attribués par la répartition, exécutés par les chauffeurs avec preuve de livraison.',
      'card.prove.title': 'Prouver',
      'card.prove.desc': "Chaque contrôle, défaut, document et dossier de formation devient une preuve d'audit DVSA et Home Office — assemblée en un clic quand un inspecteur se présente.",
      'card.improve.title': 'Améliorer',
      'card.improve.desc': 'Un score de conformité en direct et des indicateurs transversaux montrent exactement où vous en êtes — et où se situe le prochain risque, avant qu\'il ne vous coûte cher.',

      'card.shippers.title': 'Pour les expéditeurs',
      'card.shippers.desc': "Demandez un devis, réservez un enlèvement, suivez un colis et téléchargez la preuve de livraison — sans avoir besoin de compte pour commencer.",
      'card.shippers.link': 'Voir les services →',
      'card.operators.title': 'Pour les exploitants',
      'card.operators.desc': "Gérez la répartition, la flotte, le personnel, les finances et la conformité depuis une seule plateforme multi-locataire — avec des panneaux par rôle pour chaque équipe.",
      'card.operators.link': 'Accéder à la plateforme →',


      'trust.security.title': 'Sécurité de niveau professionnel.',
      'trust.security.desc': 'Vos données sont protégées, chiffrées en transit et au repos, sur une infrastructure hébergée au Royaume-Uni.',
      'trust.powered': 'Propulsé par',


      'contact.form.kicker': 'Contactez-nous',
      'contact.form.title': 'Envoyer une demande.',
      'contact.form.sub': 'Devis, questions sur nos services, partenariats ou assistance — tout arrive directement dans la file des opérations.',

      'footer.tagline': "Le système d'exploitation pour les entreprises de transport — chauffeurs, véhicules, conformité, tachygraphes et maintenance sur une seule plateforme connectée.",
      'footer.platformHeading': 'Plateforme',
      'footer.legalHeading': 'Mentions légales',
      'footer.partnerships': 'Partenariats',

      'stats2.rolePanels': 'Panneaux de rôle connectés',
      'stats2.domainsOnePlatform': "Domaines d'exploitation, une plateforme",
      'stats2.auditPacks': "Dossiers de preuve d'audit DVSA",
      'stats2.realTimeMonitoring': 'Surveillance en temps réel',


      'contact.info.emailLabel': 'E-mail',
      'contact.info.hoursLabel': 'Horaires',
      'contact.info.hoursValue': 'Lun–ven · 08h00–18h00',
      'contact.info.urgentLabel': 'Travail urgent',
      'contact.info.urgentValue': "Soumettez à tout moment — visible dans la file d'attente",
      'contact.form.nameLabel': 'Nom',
      'contact.form.emailLabel': 'E-mail',
      'contact.form.phoneLabel': 'Téléphone',
      'contact.form.companyLabel': 'Entreprise',
      'contact.form.typeLabel': 'Type de demande',
      'contact.form.type.quote': 'Demande de devis',
      'contact.form.type.service': 'Question sur un service',
      'contact.form.type.tracking': 'Assistance suivi',
      'contact.form.type.partnership': 'Partenariat',
      'contact.form.type.general': 'Demande générale',
      'contact.form.messageLabel': 'Message',
      'contact.form.submit': 'Envoyer la demande',
      'contact.form.successNotice': 'Merci — votre demande a été reçue. Nous vous recontacterons sous peu.',

      'track.form.refLabel': 'Référence de suivi',
      'track.form.refPlaceholder': 'p. ex. 256-LANE-042',
      'track.form.submit': 'Vérifier le statut',
      'track.help': "Saisissez une référence pour le statut en direct, l'heure d'arrivée estimée et l'historique des étapes. Besoin d'aide ?",
      'track.help.contactDesk': 'Contactez le service',
      'track.empty.awaitingRef': 'En attente de référence',
      'track.empty.readyToTrack': 'Prêt à suivre',
      'track.empty.liveTracking': 'Suivi en direct',
      'track.empty.statusLabel': 'Statut',
      'track.empty.statusValue': 'Saisissez une référence',
      'track.empty.milestonesLabel': 'Étapes',
      'track.empty.milestonesValue': 'Aperçu activé',
      'track.empty.supportLabel': 'Assistance',
      'track.empty.contactDesk': 'Contacter le service',
      'track.empty.notice': "Saisissez une référence publique pour prévisualiser le statut, l'heure d'arrivée estimée, le créneau du véhicule et les étapes de l'envoi.",
      'track.result.refLabel': 'Référence de suivi',
      'track.result.collection': 'Enlèvement',
      'track.result.delivery': 'Livraison',
      'track.result.serviceLabel': 'Service',
      'track.result.etaLabel': "Créneau d'arrivée estimé",
      'track.result.vehicleLabel': 'Créneau véhicule',
      'track.result.nextAction': 'Prochaine étape :',

      'footer.ukOps': 'Opérations logistiques au Royaume-Uni',
      'footer.signatureWork': 'Une réalisation signée par',
    },

    es: {
      'brand.tagline': 'El sistema operativo para empresas de transporte',
      'aria.toggleTheme': 'Cambiar tema',
      'aria.toggleLanguage': 'Cambiar idioma',
      'aria.brandHome': 'Inicio de FLEETS.HQ',
      'aria.showPassword': 'Mostrar contraseña',
      'aria.hidePassword': 'Ocultar contraseña',

      'welcome.hero.headline': 'Una plataforma.<br>Control <span class="accent">total.</span>',
      'welcome.hero.sub': 'Conductores, vehículos, cumplimiento, tacógrafos y mantenimiento — todo lo que su operación de transporte necesita, en una plataforma conectada.',
      'pillar.drivers': 'Conductores',
      'pillar.vehicles': 'Vehículos',
      'pillar.compliance': 'Cumplimiento',
      'pillar.tachographs': 'Tacógrafos',
      'pillar.maintenance': 'Mantenimiento',
      'welcome.tagline': '<b>Creado por transportistas.</b> Para transportistas.',
      'stat.domains.l': 'Dominios operativos',
      'stat.dvsa.l': 'Listo para auditoría',
      'stat.uk.l': 'Alojado en el Reino Unido y conforme al RGPD',
      'stat.monitoring.l': 'Supervisión del cumplimiento',

      'form.eyebrow': 'Acceso seguro',
      'form.title': 'Bienvenido de nuevo',
      'form.subtitle': 'Inicie sesión en su panel de FLEETS.HQ.',
      'form.emailLabel': 'Correo electrónico',
      'form.passwordLabel': 'Contraseña',
      'form.remember': 'Recordarme',
      'form.forgot': '¿Olvidó su contraseña?',
      'form.submit': 'Iniciar sesión',
      'form.submitting': 'Iniciando sesión…',
      'form.trust': 'Sesión cifrada · autenticación JWT · alojado en el Reino Unido',
      'form.registerPrompt': '¿Nuevo aquí?',
      'form.registerLink': 'Registre su empresa',

      'footer.trust': 'Seguridad de nivel empresarial. Sus datos están protegidos, cifrados en tránsito y en reposo, en infraestructura alojada en el Reino Unido.',
      'footer.poweredBy': 'Desarrollado por',
      'footer.contact': 'Contacto',
      'footer.track': 'Rastrear un envío',
      'footer.privacy': 'Privacidad',

      'nav.track': 'Rastrear',
      'nav.contact': 'Contacto',
      'nav.getStarted': 'Comenzar',
      'nav.signIn': 'Iniciar sesión',
      'nav.getQuote': 'Solicitar presupuesto',

      'home.hero.title': 'Una plataforma. Control total<span class="grad">.</span>',
      'home.hero.sub': 'El sistema operativo para empresas de transporte. Conductores, vehículos, cumplimiento, tacógrafos y mantenimiento — una plataforma conectada que responsabiliza cada kilómetro.',
      'contact.hero.title': 'Hable con el equipo de transporte<span class="grad">.</span>',
      'contact.hero.sub': 'Envíe una solicitud de presupuesto, consulta de asociación o pregunta sobre servicios — llega directamente al centro de operaciones.',
      'track.hero.title': 'Rastrear un envío<span class="grad">.</span>',
      'track.hero.sub': 'Consulte una referencia para ver el estado en vivo, la hora estimada de llegada y el historial de hitos — sin necesidad de cuenta.',

      'hero.requestQuote': 'Solicitar presupuesto',
      'hero.trackShipment': 'Rastrear un envío',
      'metric.domains': 'dominios operativos',
      'metric.dvsa': 'listo para auditoría',
      'metric.monitoring': 'supervisión en tiempo real',

      'chip.audit': 'Preparación para auditoría 98 %',
      'chip.auditSub': 'Personal · Flota · Conductor',
      'chip.live': 'Supervisión en vivo',
      'chip.liveSub': 'toda la flota · tiempo real',

      'pillars.drivers.desc': 'Licencias, CPC, formación y más',
      'pillars.vehicles.desc': 'Mantenimiento, inspecciones, ITV y defectos',
      'pillars.compliance.desc': 'DVSA, Home Office, auditorías y documentos',
      'pillars.tachographs.desc': 'Análisis digital, alertas y descargas',
      'pillars.maintenance.desc': 'Talleres, PMI, programación y costes',

      'builtby.gold': 'Creado por transportistas. Para transportistas.',
      'builtby.white': 'Una plataforma. Control total.',

      'band.oneSystem.kicker': 'Un sistema conectado',
      'band.oneSystem.title': 'Mover, demostrar, mejorar — sin hojas de cálculo.',
      'band.oneSystem.sub': 'La reserva de clientes, el despacho, la entrega por conductores, el mantenimiento de flota, RR. HH., finanzas y cumplimiento dejan de ser herramientas separadas. Se convierten en una sola fuente de verdad.',
      'card.deliver.title': 'Entregar',
      'card.deliver.desc': 'Movimientos el mismo día, al día siguiente, programados y de múltiples paradas — reservados por clientes, asignados por despacho, ejecutados por conductores con prueba de entrega.',
      'card.prove.title': 'Demostrar',
      'card.prove.desc': 'Cada inspección, defecto, documento y registro de formación se convierte en evidencia de auditoría de DVSA y Home Office — reunida con un clic cuando llega un inspector.',
      'card.improve.title': 'Mejorar',
      'card.improve.desc': 'Una puntuación de cumplimiento en vivo y KPI multidominio muestran exactamente dónde se encuentra — y dónde está el próximo riesgo, antes de que le cueste dinero.',

      'card.shippers.title': 'Para remitentes',
      'card.shippers.desc': 'Solicite un presupuesto, reserve una recogida, rastree un paquete y descargue la prueba de entrega — sin necesidad de una cuenta para empezar.',
      'card.shippers.link': 'Ver servicios →',
      'card.operators.title': 'Para operadores',
      'card.operators.desc': 'Gestione despacho, flota, personal, finanzas y cumplimiento desde una plataforma multiempresa — con paneles por rol para cada equipo.',
      'card.operators.link': 'Entrar a la plataforma →',


      'trust.security.title': 'Seguridad de nivel empresarial.',
      'trust.security.desc': 'Sus datos están protegidos, cifrados en tránsito y en reposo, en infraestructura alojada en el Reino Unido.',
      'trust.powered': 'Desarrollado por',


      'contact.form.kicker': 'Póngase en contacto',
      'contact.form.title': 'Enviar una consulta.',
      'contact.form.sub': 'Presupuestos, preguntas sobre servicios, asociaciones o soporte — llega directamente a la cola de operaciones.',

      'footer.tagline': 'El sistema operativo para empresas de transporte — conductores, vehículos, cumplimiento, tacógrafos y mantenimiento en una plataforma conectada.',
      'footer.platformHeading': 'Plataforma',
      'footer.legalHeading': 'Legal',
      'footer.partnerships': 'Alianzas',

      'stats2.rolePanels': 'Paneles de rol conectados',
      'stats2.domainsOnePlatform': 'Dominios operativos, una plataforma',
      'stats2.auditPacks': 'Paquetes de evidencia de auditoría DVSA',
      'stats2.realTimeMonitoring': 'Supervisión en tiempo real',


      'contact.info.emailLabel': 'Correo electrónico',
      'contact.info.hoursLabel': 'Horario',
      'contact.info.hoursValue': 'Lun–vie · 08:00–18:00',
      'contact.info.urgentLabel': 'Trabajo urgente',
      'contact.info.urgentValue': 'Envíe en cualquier momento — visible en la bandeja de entrada',
      'contact.form.nameLabel': 'Nombre',
      'contact.form.emailLabel': 'Correo electrónico',
      'contact.form.phoneLabel': 'Teléfono',
      'contact.form.companyLabel': 'Empresa',
      'contact.form.typeLabel': 'Tipo de consulta',
      'contact.form.type.quote': 'Solicitud de presupuesto',
      'contact.form.type.service': 'Pregunta sobre servicio',
      'contact.form.type.tracking': 'Ayuda con el seguimiento',
      'contact.form.type.partnership': 'Asociación',
      'contact.form.type.general': 'Consulta general',
      'contact.form.messageLabel': 'Mensaje',
      'contact.form.submit': 'Enviar consulta',
      'contact.form.successNotice': 'Gracias — hemos recibido su consulta. Nos pondremos en contacto en breve.',

      'track.form.refLabel': 'Referencia de seguimiento',
      'track.form.refPlaceholder': 'ej. 256-LANE-042',
      'track.form.submit': 'Comprobar estado',
      'track.help': 'Introduzca una referencia para ver el estado en vivo, la hora estimada de llegada y el historial de hitos. ¿Necesita ayuda?',
      'track.help.contactDesk': 'Contacte con el servicio',
      'track.empty.awaitingRef': 'Esperando referencia',
      'track.empty.readyToTrack': 'Listo para rastrear',
      'track.empty.liveTracking': 'Seguimiento en vivo',
      'track.empty.statusLabel': 'Estado',
      'track.empty.statusValue': 'Introduzca una referencia',
      'track.empty.milestonesLabel': 'Hitos',
      'track.empty.milestonesValue': 'Vista previa activada',
      'track.empty.supportLabel': 'Soporte',
      'track.empty.contactDesk': 'Contactar con el servicio',
      'track.empty.notice': 'Introduzca una referencia pública para previsualizar el estado, la hora estimada de llegada, el espacio del vehículo y los hitos del envío.',
      'track.result.refLabel': 'Referencia de seguimiento',
      'track.result.collection': 'Recogida',
      'track.result.delivery': 'Entrega',
      'track.result.serviceLabel': 'Servicio',
      'track.result.etaLabel': 'Ventana de llegada estimada',
      'track.result.vehicleLabel': 'Espacio del vehículo',
      'track.result.nextAction': 'Próxima acción:',

      'footer.ukOps': 'Operaciones logísticas en el Reino Unido',
      'footer.signatureWork': 'Una obra firmada por',
    },

    pt: {
      'brand.tagline': 'O sistema operativo para empresas de transporte',
      'aria.toggleTheme': 'Alternar tema',
      'aria.toggleLanguage': 'Mudar idioma',
      'aria.brandHome': 'Início da FLEETS.HQ',
      'aria.showPassword': 'Mostrar palavra-passe',
      'aria.hidePassword': 'Ocultar palavra-passe',

      'welcome.hero.headline': 'Uma plataforma.<br>Controlo <span class="accent">total.</span>',
      'welcome.hero.sub': 'Motoristas, veículos, conformidade, tacógrafos e manutenção — tudo o que a sua operação de transporte precisa, numa única plataforma conectada.',
      'pillar.drivers': 'Motoristas',
      'pillar.vehicles': 'Veículos',
      'pillar.compliance': 'Conformidade',
      'pillar.tachographs': 'Tacógrafos',
      'pillar.maintenance': 'Manutenção',
      'welcome.tagline': '<b>Criado por transportadoras.</b> Para transportadoras.',
      'stat.domains.l': 'Domínios operacionais',
      'stat.dvsa.l': 'Pronto para auditoria',
      'stat.uk.l': 'Alojado no Reino Unido, conforme com o RGPD',
      'stat.monitoring.l': 'Monitorização da conformidade',

      'form.eyebrow': 'Acesso seguro',
      'form.title': 'Bem-vindo de volta',
      'form.subtitle': 'Inicie sessão no seu painel FLEETS.HQ.',
      'form.emailLabel': 'Endereço de e-mail',
      'form.passwordLabel': 'Palavra-passe',
      'form.remember': 'Lembrar-me',
      'form.forgot': 'Esqueceu a palavra-passe?',
      'form.submit': 'Iniciar sessão',
      'form.submitting': 'A iniciar sessão…',
      'form.trust': 'Sessão encriptada · autenticação JWT · alojado no Reino Unido',
      'form.registerPrompt': 'Novo por aqui?',
      'form.registerLink': 'Registe a sua empresa',

      'footer.trust': 'Segurança de nível empresarial. Os seus dados estão protegidos, encriptados em trânsito e em repouso, em infraestrutura alojada no Reino Unido.',
      'footer.poweredBy': 'Desenvolvido por',
      'footer.contact': 'Contacto',
      'footer.track': 'Rastrear uma remessa',
      'footer.privacy': 'Privacidade',

      'nav.track': 'Rastrear',
      'nav.contact': 'Contacto',
      'nav.getStarted': 'Começar',
      'nav.signIn': 'Iniciar sessão',
      'nav.getQuote': 'Pedir orçamento',

      'home.hero.title': 'Uma plataforma. Controlo total<span class="grad">.</span>',
      'home.hero.sub': 'O sistema operativo para empresas de transporte. Motoristas, veículos, conformidade, tacógrafos e manutenção — uma plataforma conectada que torna cada quilómetro responsável.',
      'contact.hero.title': 'Fale com a equipa de transporte<span class="grad">.</span>',
      'contact.hero.sub': 'Envie um pedido de orçamento, uma consulta de parceria ou uma pergunta sobre serviços — chega diretamente ao centro de operações.',
      'track.hero.title': 'Rastrear uma remessa<span class="grad">.</span>',
      'track.hero.sub': 'Verifique uma referência para estado em direto, hora prevista de chegada e histórico de marcos — sem necessidade de conta.',

      'hero.requestQuote': 'Pedir orçamento',
      'hero.trackShipment': 'Rastrear uma remessa',
      'metric.domains': 'domínios operacionais',
      'metric.dvsa': 'pronto para auditoria',
      'metric.monitoring': 'monitorização em tempo real',

      'chip.audit': 'Prontidão para auditoria 98%',
      'chip.auditSub': 'Pessoas · Frota · Motorista',
      'chip.live': 'Monitorização em direto',
      'chip.liveSub': 'toda a frota · tempo real',

      'pillars.drivers.desc': 'Licenças, CPC, formação e mais',
      'pillars.vehicles.desc': 'Manutenção, inspeções, IPO e defeitos',
      'pillars.compliance.desc': 'DVSA, Home Office, auditorias e documentos',
      'pillars.tachographs.desc': 'Análise digital, alertas e transferências',
      'pillars.maintenance.desc': 'Oficinas, PMI, agendamento e custos',

      'builtby.gold': 'Criado por transportadoras. Para transportadoras.',
      'builtby.white': 'Uma plataforma. Controlo total.',

      'band.oneSystem.kicker': 'Um sistema conectado',
      'band.oneSystem.title': 'Mover, provar, melhorar — sem folhas de cálculo.',
      'band.oneSystem.sub': 'Reservas de clientes, despacho, entrega por motoristas, manutenção de frota, RH, finanças e conformidade deixam de ser ferramentas separadas. Tornam-se numa única fonte de verdade.',
      'card.deliver.title': 'Entregar',
      'card.deliver.desc': 'Movimentos no mesmo dia, no dia seguinte, agendados e com múltiplas paragens — reservados por clientes, alocados pelo despacho, executados por motoristas com prova de entrega.',
      'card.prove.title': 'Provar',
      'card.prove.desc': 'Cada verificação, defeito, documento e registo de formação torna-se prova de auditoria da DVSA e do Home Office — reunida com um clique quando um inspetor aparece.',
      'card.improve.title': 'Melhorar',
      'card.improve.desc': 'Uma pontuação de conformidade em direto e KPIs multidomínio mostram exatamente onde está — e onde está o próximo risco, antes de custar dinheiro.',

      'card.shippers.title': 'Para expedidores',
      'card.shippers.desc': 'Peça um orçamento, reserve uma recolha, rastreie uma encomenda e transfira a prova de entrega — sem precisar de conta para começar.',
      'card.shippers.link': 'Ver serviços →',
      'card.operators.title': 'Para operadores',
      'card.operators.desc': 'Faça a gestão do despacho, frota, pessoas, finanças e conformidade a partir de uma única plataforma multi-inquilino — com painéis por função para cada equipa.',
      'card.operators.link': 'Entrar na plataforma →',


      'trust.security.title': 'Segurança de nível empresarial.',
      'trust.security.desc': 'Os seus dados estão protegidos, encriptados em trânsito e em repouso, em infraestrutura alojada no Reino Unido.',
      'trust.powered': 'Desenvolvido por',


      'contact.form.kicker': 'Entre em contacto',
      'contact.form.title': 'Enviar um pedido.',
      'contact.form.sub': 'Orçamentos, perguntas sobre serviços, parcerias ou suporte — chega diretamente à fila de operações.',

      'footer.tagline': 'O sistema operativo para empresas de transporte — motoristas, veículos, conformidade, tacógrafos e manutenção numa única plataforma conectada.',
      'footer.platformHeading': 'Plataforma',
      'footer.legalHeading': 'Legal',
      'footer.partnerships': 'Parcerias',

      'stats2.rolePanels': 'Painéis de função conectados',
      'stats2.domainsOnePlatform': 'Domínios operacionais, uma plataforma',
      'stats2.auditPacks': 'Pacotes de prova de auditoria DVSA',
      'stats2.realTimeMonitoring': 'Monitorização em tempo real',


      'contact.info.emailLabel': 'E-mail',
      'contact.info.hoursLabel': 'Horário',
      'contact.info.hoursValue': 'Seg–sex · 08:00–18:00',
      'contact.info.urgentLabel': 'Trabalho urgente',
      'contact.info.urgentValue': 'Envie a qualquer hora — visível na receção de pedidos',
      'contact.form.nameLabel': 'Nome',
      'contact.form.emailLabel': 'E-mail',
      'contact.form.phoneLabel': 'Telefone',
      'contact.form.companyLabel': 'Empresa',
      'contact.form.typeLabel': 'Tipo de pedido',
      'contact.form.type.quote': 'Pedido de orçamento',
      'contact.form.type.service': 'Pergunta sobre serviço',
      'contact.form.type.tracking': 'Apoio ao rastreio',
      'contact.form.type.partnership': 'Parceria',
      'contact.form.type.general': 'Pedido geral',
      'contact.form.messageLabel': 'Mensagem',
      'contact.form.submit': 'Enviar pedido',
      'contact.form.successNotice': 'Obrigado — o seu pedido foi recebido. Entraremos em contacto em breve.',

      'track.form.refLabel': 'Referência de rastreio',
      'track.form.refPlaceholder': 'ex. 256-LANE-042',
      'track.form.submit': 'Verificar estado',
      'track.help': 'Introduza uma referência para estado em direto, hora prevista de chegada e histórico de marcos. Precisa de ajuda?',
      'track.help.contactDesk': 'Contacte a equipa',
      'track.empty.awaitingRef': 'A aguardar referência',
      'track.empty.readyToTrack': 'Pronto para rastrear',
      'track.empty.liveTracking': 'Rastreio em direto',
      'track.empty.statusLabel': 'Estado',
      'track.empty.statusValue': 'Introduza uma referência',
      'track.empty.milestonesLabel': 'Marcos',
      'track.empty.milestonesValue': 'Pré-visualização ativada',
      'track.empty.supportLabel': 'Apoio',
      'track.empty.contactDesk': 'Contactar a equipa',
      'track.empty.notice': 'Introduza uma referência pública para pré-visualizar o estado, a hora prevista de chegada, o horário do veículo e os marcos da remessa.',
      'track.result.refLabel': 'Referência de rastreio',
      'track.result.collection': 'Recolha',
      'track.result.delivery': 'Entrega',
      'track.result.serviceLabel': 'Serviço',
      'track.result.etaLabel': 'Janela de chegada prevista',
      'track.result.vehicleLabel': 'Horário do veículo',
      'track.result.nextAction': 'Próxima ação:',

      'footer.ukOps': 'Operações logísticas no Reino Unido',
      'footer.signatureWork': 'Uma obra assinada por',
    },
  };

  var LANGS = ['en', 'fr', 'es', 'pt'];
  var FLAGS = { en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', pt: '🇵🇹' };

  function detectLang() {
    var stored = localStorage.getItem('public-lang');
    if (stored && STRINGS[stored]) return stored;
    var cookie = document.cookie.match(/(?:^|; )publicLang=([^;]+)/);
    if (cookie && STRINGS[cookie[1]]) return cookie[1];
    var nav = ((navigator.language || navigator.userLanguage || 'en').slice(0, 2)).toLowerCase();
    return STRINGS[nav] ? nav : 'en';
  }

  function t(key, lang) {
    var dict = STRINGS[lang] || STRINGS.en;
    var val = dict[key];
    if (val == null) val = STRINGS.en[key];
    return val;
  }

  function applyLang(lang) {
    if (!STRINGS[lang]) lang = 'en';
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key, lang);
      if (val == null) return;
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t(key, lang);
      if (val != null) el.innerHTML = val;
    });
    document.querySelectorAll('[data-lang-option]').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-lang-option') === lang);
    });
    document.querySelectorAll('[data-lang-current]').forEach(function (el) {
      el.textContent = (FLAGS[lang] || FLAGS.en);
    });

    localStorage.setItem('public-lang', lang);
    document.cookie = 'publicLang=' + lang + '; Path=/; Max-Age=31536000; SameSite=Lax';
    document.dispatchEvent(new CustomEvent('fleetlang:change', { detail: { lang: lang } }));
  }

  window.FleetI18n = { STRINGS: STRINGS, LANGS: LANGS, FLAGS: FLAGS, detectLang: detectLang, applyLang: applyLang, t: t };

  // Auto-apply on DOM ready + wire up any [data-lang-option] buttons present.
  document.addEventListener('DOMContentLoaded', function () {
    applyLang(detectLang());
    document.querySelectorAll('[data-lang-option]').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang-option')); });
    });
  });
}());
