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
      'card.shippers.link': 'Get a quote →',
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
      'card.shippers.link': 'Obtenir un devis →',
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
      'card.shippers.link': 'Solicitar presupuesto →',
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

    zh: {
      'brand.tagline': '运输公司的操作系统',
      'aria.toggleTheme': '切换主题',
      'aria.toggleLanguage': '切换语言',
      'aria.brandHome': 'FLEETS.HQ 首页',
      'aria.showPassword': '显示密码',
      'aria.hidePassword': '隐藏密码',

      'welcome.hero.headline': '一个平台。<br>全面<span class="accent">掌控。</span>',
      'welcome.hero.sub': '驾驶员、车辆、合规、行车记录仪和维护 — 您的运输业务所需的一切，尽在一个互联平台。',
      'pillar.drivers': '驾驶员',
      'pillar.vehicles': '车辆',
      'pillar.compliance': '合规',
      'pillar.tachographs': '行车记录仪',
      'pillar.maintenance': '维护',
      'welcome.tagline': '<b>由运输商打造。</b>为运输商服务。',
      'stat.domains.l': '运营领域',
      'stat.dvsa.l': '审计就绪',
      'stat.uk.l': '英国托管，符合GDPR',
      'stat.monitoring.l': '合规监控',

      'form.eyebrow': '安全访问',
      'form.title': '欢迎回来',
      'form.subtitle': '登录您的 FLEETS.HQ 控制台。',
      'form.emailLabel': '电子邮箱',
      'form.passwordLabel': '密码',
      'form.remember': '记住我',
      'form.forgot': '忘记密码？',
      'form.submit': '登录控制台',
      'form.submitting': '正在登录…',
      'form.trust': '会话加密 · JWT 身份验证 · 英国托管',
      'form.registerPrompt': '初次使用？',
      'form.registerLink': '注册您的公司',

      'footer.trust': '企业级安全保障。您的数据受到保护，传输和静态存储均已加密，托管于英国基础设施。',
      'footer.poweredBy': '技术支持',
      'footer.contact': '联系我们',
      'footer.track': '追踪货件',
      'footer.privacy': '隐私政策',

      'nav.track': '追踪',
      'nav.contact': '联系我们',
      'nav.getStarted': '开始使用',
      'nav.signIn': '登录',
      'nav.getQuote': '获取报价',

      'home.hero.title': '一个平台。全面掌控<span class="grad">。</span>',
      'home.hero.sub': '运输公司的操作系统。驾驶员、车辆、合规、行车记录仪和维护 — 一个互联平台，让每一英里都有据可查。',
      'contact.hero.title': '联系我们的运输团队<span class="grad">。</span>',
      'contact.hero.sub': '发送报价请求、合作咨询或服务问题 — 将直接送达运营中心。',
      'track.hero.title': '追踪货件<span class="grad">。</span>',
      'track.hero.sub': '查询参考编号以获取实时状态、预计到达时间和里程碑历史 — 无需账户。',

      'hero.requestQuote': '获取报价',
      'hero.trackShipment': '追踪货件',
      'metric.domains': '个运营领域',
      'metric.dvsa': '审计就绪',
      'metric.monitoring': '实时监控',

      'chip.audit': '审计就绪度 98%',
      'chip.auditSub': '人员 · 车队 · 驾驶员',
      'chip.live': '实时监控',
      'chip.liveSub': '全车队 · 实时',

      'pillars.drivers.desc': '驾照、CPC、培训等',
      'pillars.vehicles.desc': '维护、检查、MOT年检和故障',
      'pillars.compliance.desc': 'DVSA、内政部、审计和文档',
      'pillars.tachographs.desc': '数字分析、警报和下载',
      'pillars.maintenance.desc': '维修厂、PMI、排程和成本',

      'builtby.gold': '由运输商打造。为运输商服务。',
      'builtby.white': '一个平台。全面掌控。',

      'band.oneSystem.kicker': '一个互联系统',
      'band.oneSystem.title': '行动、举证、改进 — 无需电子表格。',
      'band.oneSystem.sub': '客户预订、调度、司机配送、车队维护、人力资源、财务和合规不再是各自独立的工具，而是统一为一个真实数据源。',
      'card.deliver.title': '配送',
      'card.deliver.desc': '当日达、次日达、预约配送和多点配送 — 由客户预订、调度分配、司机执行并提供配送证明。',
      'card.prove.title': '举证',
      'card.prove.desc': '每一次检查、故障、文档和培训记录都成为 DVSA 和内政部的审计证据 — 检查员到访时一键生成。',
      'card.improve.title': '改进',
      'card.improve.desc': '实时合规评分和跨领域关键指标，让您清楚了解现状 — 以及下一个风险所在，防患于未然。',

      'card.shippers.title': '面向货主',
      'card.shippers.desc': '请求报价、预订取件、追踪包裹并下载配送证明 — 无需账户即可开始。',
      'card.shippers.link': '获取报价 →',
      'card.operators.title': '面向运营商',
      'card.operators.desc': '在一个多租户平台上运行调度、车队、人员、财务和合规 — 每个团队都有基于角色的面板。',
      'card.operators.link': '进入平台 →',

      'trust.security.title': '企业级安全保障。',
      'trust.security.desc': '您的数据受到保护，传输和静态存储均已加密，托管于英国基础设施。',
      'trust.powered': '技术支持',

      'contact.form.kicker': '联系我们',
      'contact.form.title': '发送咨询。',
      'contact.form.sub': '报价、服务问题、合作或支持 — 将直接送达运营队列。',

      'footer.tagline': '运输公司的操作系统 — 驾驶员、车辆、合规、行车记录仪和维护，尽在一个互联平台。',
      'footer.platformHeading': '平台',
      'footer.legalHeading': '法律信息',
      'footer.partnerships': '合作伙伴',

      'stats2.rolePanels': '互联角色面板',
      'stats2.domainsOnePlatform': '运营领域，一个平台',
      'stats2.auditPacks': 'DVSA 审计证据包',
      'stats2.realTimeMonitoring': '实时监控',

      'contact.info.emailLabel': '电子邮箱',
      'contact.info.hoursLabel': '工作时间',
      'contact.info.hoursValue': '周一至周五 · 08:00–18:00',
      'contact.info.urgentLabel': '紧急工作',
      'contact.info.urgentValue': '随时提交 — 在收件箱中可见',
      'contact.form.nameLabel': '姓名',
      'contact.form.emailLabel': '电子邮箱',
      'contact.form.phoneLabel': '电话',
      'contact.form.companyLabel': '公司',
      'contact.form.typeLabel': '咨询类型',
      'contact.form.type.quote': '报价请求',
      'contact.form.type.service': '服务问题',
      'contact.form.type.tracking': '追踪支持',
      'contact.form.type.partnership': '合作伙伴关系',
      'contact.form.type.general': '一般咨询',
      'contact.form.messageLabel': '留言',
      'contact.form.submit': '发送咨询',
      'contact.form.successNotice': '谢谢 — 我们已收到您的咨询，将尽快与您联系。',

      'track.form.refLabel': '追踪编号',
      'track.form.refPlaceholder': '例如 256-LANE-042',
      'track.form.submit': '查询状态',
      'track.help': '输入编号以查看实时状态、预计到达时间和里程碑历史。需要帮助？',
      'track.help.contactDesk': '联系客服',
      'track.empty.awaitingRef': '等待编号',
      'track.empty.readyToTrack': '准备追踪',
      'track.empty.liveTracking': '实时追踪',
      'track.empty.statusLabel': '状态',
      'track.empty.statusValue': '请输入编号',
      'track.empty.milestonesLabel': '里程碑',
      'track.empty.milestonesValue': '预览已启用',
      'track.empty.supportLabel': '支持',
      'track.empty.contactDesk': '联系客服',
      'track.empty.notice': '输入公开编号以预览状态、预计到达时间、车辆安排和货件里程碑。',
      'track.result.refLabel': '追踪编号',
      'track.result.collection': '取件',
      'track.result.delivery': '配送',
      'track.result.serviceLabel': '服务',
      'track.result.etaLabel': '预计到达时间',
      'track.result.vehicleLabel': '车辆安排',
      'track.result.nextAction': '下一步：',

      'footer.ukOps': '英国物流运营',
      'footer.signatureWork': '出品方',
    },

    ar: {
      'brand.tagline': 'نظام التشغيل لشركات النقل',
      'aria.toggleTheme': 'تبديل المظهر',
      'aria.toggleLanguage': 'تغيير اللغة',
      'aria.brandHome': 'الصفحة الرئيسية لـ FLEETS.HQ',
      'aria.showPassword': 'إظهار كلمة المرور',
      'aria.hidePassword': 'إخفاء كلمة المرور',

      'welcome.hero.headline': 'منصة واحدة.<br>تحكم <span class="accent">كامل.</span>',
      'welcome.hero.sub': 'السائقون والمركبات والامتثال وأجهزة التاكوغراف والصيانة — كل ما تحتاجه عملية النقل الخاصة بك، في منصة واحدة متصلة.',
      'pillar.drivers': 'السائقون',
      'pillar.vehicles': 'المركبات',
      'pillar.compliance': 'الامتثال',
      'pillar.tachographs': 'أجهزة التاكوغراف',
      'pillar.maintenance': 'الصيانة',
      'welcome.tagline': '<b>صُنع بواسطة الناقلين.</b> من أجل الناقلين.',
      'stat.domains.l': 'مجالات التشغيل',
      'stat.dvsa.l': 'جاهز للتدقيق',
      'stat.uk.l': 'مستضاف في المملكة المتحدة ومتوافق مع اللائحة العامة لحماية البيانات',
      'stat.monitoring.l': 'مراقبة الامتثال',

      'form.eyebrow': 'وصول آمن',
      'form.title': 'مرحباً بعودتك',
      'form.subtitle': 'سجّل الدخول إلى لوحة تحكم FLEETS.HQ الخاصة بك.',
      'form.emailLabel': 'البريد الإلكتروني',
      'form.passwordLabel': 'كلمة المرور',
      'form.remember': 'تذكرني',
      'form.forgot': 'هل نسيت كلمة المرور؟',
      'form.submit': 'تسجيل الدخول إلى لوحة التحكم',
      'form.submitting': 'جارٍ تسجيل الدخول…',
      'form.trust': 'جلسة مشفّرة · مصادقة JWT · مستضاف في المملكة المتحدة',
      'form.registerPrompt': 'جديد هنا؟',
      'form.registerLink': 'سجّل شركتك',

      'footer.trust': 'أمان بمستوى المؤسسات. بياناتك محمية ومشفّرة أثناء النقل وفي حالة السكون، على بنية تحتية مستضافة في المملكة المتحدة.',
      'footer.poweredBy': 'مدعوم من',
      'footer.contact': 'اتصل بنا',
      'footer.track': 'تتبع شحنة',
      'footer.privacy': 'الخصوصية',

      'nav.track': 'تتبع',
      'nav.contact': 'اتصل بنا',
      'nav.getStarted': 'ابدأ الآن',
      'nav.signIn': 'تسجيل الدخول',
      'nav.getQuote': 'احصل على عرض سعر',

      'home.hero.title': 'منصة واحدة. تحكم كامل<span class="grad">.</span>',
      'home.hero.sub': 'نظام التشغيل لشركات النقل. السائقون والمركبات والامتثال وأجهزة التاكوغراف والصيانة — منصة واحدة متصلة تجعل كل ميل خاضعاً للمساءلة.',
      'contact.hero.title': 'تحدث إلى فريق النقل<span class="grad">.</span>',
      'contact.hero.sub': 'أرسل طلب عرض سعر أو استفسار شراكة أو سؤالاً عن الخدمة — يصل مباشرة إلى مركز العمليات.',
      'track.hero.title': 'تتبع شحنة<span class="grad">.</span>',
      'track.hero.sub': 'تحقق من رقم مرجعي للحصول على الحالة المباشرة والوقت المتوقع للوصول وسجل المراحل — دون الحاجة لحساب.',

      'hero.requestQuote': 'اطلب عرض سعر',
      'hero.trackShipment': 'تتبع شحنة',
      'metric.domains': 'مجالات تشغيل',
      'metric.dvsa': 'جاهز للتدقيق',
      'metric.monitoring': 'مراقبة في الوقت الفعلي',

      'chip.audit': 'جاهزية التدقيق 98%',
      'chip.auditSub': 'الأفراد · الأسطول · السائق',
      'chip.live': 'مراقبة مباشرة',
      'chip.liveSub': 'على مستوى الأسطول · في الوقت الفعلي',

      'pillars.drivers.desc': 'الرخص وشهادة الكفاءة المهنية والتدريب والمزيد',
      'pillars.vehicles.desc': 'الصيانة والفحوصات وفحص MOT والأعطال',
      'pillars.compliance.desc': 'DVSA ووزارة الداخلية والتدقيقات والمستندات',
      'pillars.tachographs.desc': 'تحليل رقمي وتنبيهات وتنزيلات',
      'pillars.maintenance.desc': 'الورش وجدول PMI والجدولة والتكاليف',

      'builtby.gold': 'صُنع بواسطة الناقلين. من أجل الناقلين.',
      'builtby.white': 'منصة واحدة. تحكم كامل.',

      'band.oneSystem.kicker': 'نظام واحد متصل',
      'band.oneSystem.title': 'تحرّك، أثبت، تحسّن — بلا جداول بيانات.',
      'band.oneSystem.sub': 'حجز العملاء والتوزيع وتسليم السائقين وصيانة الأسطول والموارد البشرية والمالية والامتثال لم تعد أدوات منفصلة، بل أصبحت مصدراً واحداً موثوقاً للمعلومات.',
      'card.deliver.title': 'التسليم',
      'card.deliver.desc': 'تحركات في نفس اليوم، اليوم التالي، المجدولة ومتعددة النقاط — يحجزها العملاء، يوزّعها قسم التوزيع، وينفذها السائقون مع إثبات التسليم.',
      'card.prove.title': 'الإثبات',
      'card.prove.desc': 'يصبح كل فحص وعطل ومستند وسجل تدريب دليل تدقيق لـ DVSA ووزارة الداخلية — يُجمع بنقرة واحدة عند زيارة المفتش.',
      'card.improve.title': 'التحسين',
      'card.improve.desc': 'تُظهر نتيجة الامتثال المباشرة ومؤشرات الأداء متعددة المجالات موقعك بالضبط — وأين يكمن الخطر التالي، قبل أن يكلفك ذلك.',

      'card.shippers.title': 'للشاحنين',
      'card.shippers.desc': 'اطلب عرض سعر، احجز استلاماً، تتبع طرداً، وحمّل إثبات التسليم — دون الحاجة إلى حساب للبدء.',
      'card.shippers.link': 'احصل على عرض سعر ←',
      'card.operators.title': 'للمشغلين',
      'card.operators.desc': 'أدر التوزيع والأسطول والأفراد والمالية والامتثال من منصة واحدة متعددة المستأجرين — بلوحات مخصصة لكل دور ولكل فريق.',
      'card.operators.link': 'ادخل إلى المنصة ←',

      'trust.security.title': 'أمان بمستوى المؤسسات.',
      'trust.security.desc': 'بياناتك محمية ومشفّرة أثناء النقل وفي حالة السكون، على بنية تحتية مستضافة في المملكة المتحدة.',
      'trust.powered': 'مدعوم من',

      'contact.form.kicker': 'تواصل معنا',
      'contact.form.title': 'أرسل استفساراً.',
      'contact.form.sub': 'عروض الأسعار، أسئلة الخدمة، الشراكات أو الدعم — تصل مباشرة إلى قائمة انتظار العمليات.',

      'footer.tagline': 'نظام التشغيل لشركات النقل — السائقون والمركبات والامتثال وأجهزة التاكوغراف والصيانة في منصة واحدة متصلة.',
      'footer.platformHeading': 'المنصة',
      'footer.legalHeading': 'قانوني',
      'footer.partnerships': 'الشراكات',

      'stats2.rolePanels': 'لوحات أدوار متصلة',
      'stats2.domainsOnePlatform': 'مجالات تشغيل، منصة واحدة',
      'stats2.auditPacks': 'حزم أدلة تدقيق DVSA',
      'stats2.realTimeMonitoring': 'مراقبة في الوقت الفعلي',

      'contact.info.emailLabel': 'البريد الإلكتروني',
      'contact.info.hoursLabel': 'ساعات العمل',
      'contact.info.hoursValue': 'الاثنين–الجمعة · 08:00–18:00',
      'contact.info.urgentLabel': 'عمل عاجل',
      'contact.info.urgentValue': 'أرسل في أي وقت — يظهر في قائمة الاستلام',
      'contact.form.nameLabel': 'الاسم',
      'contact.form.emailLabel': 'البريد الإلكتروني',
      'contact.form.phoneLabel': 'الهاتف',
      'contact.form.companyLabel': 'الشركة',
      'contact.form.typeLabel': 'نوع الاستفسار',
      'contact.form.type.quote': 'طلب عرض سعر',
      'contact.form.type.service': 'سؤال عن الخدمة',
      'contact.form.type.tracking': 'دعم التتبع',
      'contact.form.type.partnership': 'شراكة',
      'contact.form.type.general': 'استفسار عام',
      'contact.form.messageLabel': 'الرسالة',
      'contact.form.submit': 'إرسال الاستفسار',
      'contact.form.successNotice': 'شكراً — تم استلام استفسارك. سنتواصل معك قريباً.',

      'track.form.refLabel': 'الرقم المرجعي للتتبع',
      'track.form.refPlaceholder': 'مثال: 256-LANE-042',
      'track.form.submit': 'تحقق من الحالة',
      'track.help': 'أدخل رقماً مرجعياً للحصول على الحالة المباشرة والوقت المتوقع للوصول وسجل المراحل. هل تحتاج مساعدة؟',
      'track.help.contactDesk': 'تواصل مع مكتب الدعم',
      'track.empty.awaitingRef': 'بانتظار الرقم المرجعي',
      'track.empty.readyToTrack': 'جاهز للتتبع',
      'track.empty.liveTracking': 'تتبع مباشر',
      'track.empty.statusLabel': 'الحالة',
      'track.empty.statusValue': 'أدخل رقماً مرجعياً',
      'track.empty.milestonesLabel': 'المراحل',
      'track.empty.milestonesValue': 'المعاينة مفعّلة',
      'track.empty.supportLabel': 'الدعم',
      'track.empty.contactDesk': 'مكتب الدعم',
      'track.empty.notice': 'أدخل رقماً مرجعياً عاماً لمعاينة الحالة والوقت المتوقع للوصول وموعد المركبة ومراحل الشحنة.',
      'track.result.refLabel': 'الرقم المرجعي للتتبع',
      'track.result.collection': 'الاستلام',
      'track.result.delivery': 'التسليم',
      'track.result.serviceLabel': 'الخدمة',
      'track.result.etaLabel': 'نافذة الوصول المتوقعة',
      'track.result.vehicleLabel': 'موعد المركبة',
      'track.result.nextAction': 'الإجراء التالي:',

      'footer.ukOps': 'عمليات لوجستية في المملكة المتحدة',
      'footer.signatureWork': 'عمل موقّع من',
    },

    ro: {
      'brand.tagline': 'Sistemul de operare pentru companiile de transport',
      'aria.toggleTheme': 'Comută tema',
      'aria.toggleLanguage': 'Schimbă limba',
      'aria.brandHome': 'Pagina principală FLEETS.HQ',
      'aria.showPassword': 'Afișează parola',
      'aria.hidePassword': 'Ascunde parola',

      'welcome.hero.headline': 'O singură platformă.<br>Control <span class="accent">total.</span>',
      'welcome.hero.sub': 'Șoferi, vehicule, conformitate, tahografe și mentenanță — tot ce are nevoie operațiunea dvs. de transport, într-o singură platformă conectată.',
      'pillar.drivers': 'Șoferi',
      'pillar.vehicles': 'Vehicule',
      'pillar.compliance': 'Conformitate',
      'pillar.tachographs': 'Tahografe',
      'pillar.maintenance': 'Mentenanță',
      'welcome.tagline': '<b>Creat de transportatori.</b> Pentru transportatori.',
      'stat.domains.l': 'Domenii operaționale',
      'stat.dvsa.l': 'Pregătit pentru audit',
      'stat.uk.l': 'Găzduit în UK, conform GDPR',
      'stat.monitoring.l': 'Monitorizarea conformității',

      'form.eyebrow': 'Acces securizat',
      'form.title': 'Bine ai revenit',
      'form.subtitle': 'Conectează-te la panoul tău FLEETS.HQ.',
      'form.emailLabel': 'Adresă de e-mail',
      'form.passwordLabel': 'Parolă',
      'form.remember': 'Ține-mă minte',
      'form.forgot': 'Ai uitat parola?',
      'form.submit': 'Conectare la panou',
      'form.submitting': 'Se conectează…',
      'form.trust': 'Sesiune criptată · autentificare JWT · găzduit în UK',
      'form.registerPrompt': 'Ești nou aici?',
      'form.registerLink': 'Înregistrează-ți compania',

      'footer.trust': 'Securitate de nivel enterprise. Datele tale sunt protejate, criptate în tranzit și în repaus, pe infrastructură găzduită în UK.',
      'footer.poweredBy': 'Susținut de',
      'footer.contact': 'Contact',
      'footer.track': 'Urmărește o expediere',
      'footer.privacy': 'Confidențialitate',

      'nav.track': 'Urmărire',
      'nav.contact': 'Contact',
      'nav.getStarted': 'Începe acum',
      'nav.signIn': 'Conectare',
      'nav.getQuote': 'Obține o ofertă',

      'home.hero.title': 'O singură platformă. Control total<span class="grad">.</span>',
      'home.hero.sub': 'Sistemul de operare pentru companiile de transport. Șoferi, vehicule, conformitate, tahografe și mentenanță — o platformă conectată care face fiecare kilometru responsabil.',
      'contact.hero.title': 'Vorbește cu echipa de transport<span class="grad">.</span>',
      'contact.hero.sub': 'Trimite o solicitare de ofertă, o cerere de parteneriat sau o întrebare despre servicii — ajunge direct la centrul de operațiuni.',
      'track.hero.title': 'Urmărește o expediere<span class="grad">.</span>',
      'track.hero.sub': 'Verifică o referință pentru status live, fereastra de sosire estimată și istoricul etapelor — fără cont necesar.',

      'hero.requestQuote': 'Solicită o ofertă',
      'hero.trackShipment': 'Urmărește o expediere',
      'metric.domains': 'domenii operaționale',
      'metric.dvsa': 'pregătit pentru audit',
      'metric.monitoring': 'monitorizare în timp real',

      'chip.audit': 'Pregătire audit 98%',
      'chip.auditSub': 'Personal · Flotă · Șofer',
      'chip.live': 'Monitorizare live',
      'chip.liveSub': 'la nivelul întregii flote · în timp real',

      'pillars.drivers.desc': 'Permise, CPC, instruire și altele',
      'pillars.vehicles.desc': 'Mentenanță, inspecții, ITP și defecțiuni',
      'pillars.compliance.desc': 'DVSA, Home Office, audituri și documente',
      'pillars.tachographs.desc': 'Analiză digitală, alerte și descărcări',
      'pillars.maintenance.desc': 'Ateliere, PMI, programare și costuri',

      'builtby.gold': 'Creat de transportatori. Pentru transportatori.',
      'builtby.white': 'O singură platformă. Control total.',

      'band.oneSystem.kicker': 'Un singur sistem conectat',
      'band.oneSystem.title': 'Mișcă, dovedește, îmbunătățește — fără foi de calcul.',
      'band.oneSystem.sub': 'Rezervările clienților, dispecerizarea, livrarea de către șoferi, mentenanța flotei, HR, finanțele și conformitatea nu mai sunt instrumente separate. Devin o singură sursă de adevăr.',
      'card.deliver.title': 'Livrare',
      'card.deliver.desc': 'Mișcări în aceeași zi, a doua zi, programate și cu opriri multiple — rezervate de clienți, alocate de dispecerat, executate de șoferi cu dovadă de livrare.',
      'card.prove.title': 'Dovadă',
      'card.prove.desc': 'Fiecare verificare, defecțiune, document și înregistrare de instruire devine dovadă de audit DVSA și Home Office — asamblată dintr-un clic când vine un inspector.',
      'card.improve.title': 'Îmbunătățire',
      'card.improve.desc': 'Un scor de conformitate live și indicatori-cheie interdomeniu arată exact unde te afli — și unde este următorul risc, înainte să te coste.',

      'card.shippers.title': 'Pentru expeditori',
      'card.shippers.desc': 'Solicită o ofertă, programează o ridicare, urmărește un colet și descarcă dovada de livrare — fără a avea nevoie de cont pentru a începe.',
      'card.shippers.link': 'Obține o ofertă →',
      'card.operators.title': 'Pentru operatori',
      'card.operators.desc': 'Gestionează dispecerizarea, flota, personalul, finanțele și conformitatea dintr-o singură platformă multi-chiriaș — cu panouri bazate pe rol pentru fiecare echipă.',
      'card.operators.link': 'Intră în platformă →',

      'trust.security.title': 'Securitate de nivel enterprise.',
      'trust.security.desc': 'Datele tale sunt protejate, criptate în tranzit și în repaus, pe infrastructură găzduită în UK.',
      'trust.powered': 'Susținut de',

      'contact.form.kicker': 'Ia legătura',
      'contact.form.title': 'Trimite o solicitare.',
      'contact.form.sub': 'Oferte, întrebări despre servicii, parteneriate sau suport — ajung direct în coada de operațiuni.',

      'footer.tagline': 'Sistemul de operare pentru companiile de transport — șoferi, vehicule, conformitate, tahografe și mentenanță într-o singură platformă conectată.',
      'footer.platformHeading': 'Platformă',
      'footer.legalHeading': 'Legal',
      'footer.partnerships': 'Parteneriate',

      'stats2.rolePanels': 'Panouri de rol conectate',
      'stats2.domainsOnePlatform': 'Domenii operaționale, o platformă',
      'stats2.auditPacks': 'Pachete de dovezi de audit DVSA',
      'stats2.realTimeMonitoring': 'Monitorizare în timp real',

      'contact.info.emailLabel': 'E-mail',
      'contact.info.hoursLabel': 'Program',
      'contact.info.hoursValue': 'Lun–Vin · 08:00–18:00',
      'contact.info.urgentLabel': 'Lucrare urgentă',
      'contact.info.urgentValue': 'Trimite oricând — vizibil în coada de recepție',
      'contact.form.nameLabel': 'Nume',
      'contact.form.emailLabel': 'E-mail',
      'contact.form.phoneLabel': 'Telefon',
      'contact.form.companyLabel': 'Companie',
      'contact.form.typeLabel': 'Tip solicitare',
      'contact.form.type.quote': 'Solicitare ofertă',
      'contact.form.type.service': 'Întrebare despre servicii',
      'contact.form.type.tracking': 'Suport urmărire',
      'contact.form.type.partnership': 'Parteneriat',
      'contact.form.type.general': 'Solicitare generală',
      'contact.form.messageLabel': 'Mesaj',
      'contact.form.submit': 'Trimite solicitarea',
      'contact.form.successNotice': 'Mulțumim — solicitarea ta a fost primită. Te vom contacta în curând.',

      'track.form.refLabel': 'Referință de urmărire',
      'track.form.refPlaceholder': 'ex. 256-LANE-042',
      'track.form.submit': 'Verifică statusul',
      'track.help': 'Introdu o referință pentru status live, fereastra de sosire estimată și istoricul etapelor. Ai nevoie de ajutor?',
      'track.help.contactDesk': 'Contactează biroul',
      'track.empty.awaitingRef': 'Se așteaptă referința',
      'track.empty.readyToTrack': 'Gata de urmărire',
      'track.empty.liveTracking': 'Urmărire live',
      'track.empty.statusLabel': 'Status',
      'track.empty.statusValue': 'Introdu o referință',
      'track.empty.milestonesLabel': 'Etape',
      'track.empty.milestonesValue': 'Previzualizare activată',
      'track.empty.supportLabel': 'Suport',
      'track.empty.contactDesk': 'Biroul de suport',
      'track.empty.notice': 'Introdu o referință publică pentru a previzualiza statusul, fereastra de sosire estimată, alocarea vehiculului și etapele expedierii.',
      'track.result.refLabel': 'Referință de urmărire',
      'track.result.collection': 'Ridicare',
      'track.result.delivery': 'Livrare',
      'track.result.serviceLabel': 'Serviciu',
      'track.result.etaLabel': 'Fereastra de sosire estimată',
      'track.result.vehicleLabel': 'Alocare vehicul',
      'track.result.nextAction': 'Următoarea acțiune:',

      'footer.ukOps': 'Operațiuni logistice în UK',
      'footer.signatureWork': 'O lucrare semnată de',
    },
  };

  var LANGS = ['en', 'fr', 'es', 'zh', 'ar', 'ro'];
  var FLAGS = { en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', zh: '🇨🇳', ar: '🇸🇦', ro: '🇷🇴' };
  var RTL_LANGS = { ar: true };

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
    document.documentElement.setAttribute('dir', RTL_LANGS[lang] ? 'rtl' : 'ltr');

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
