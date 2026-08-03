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
      'footer.about': 'About',
      'footer.services': 'Services',
      'footer.contact': 'Contact',
      'footer.track': 'Track a shipment',
      'footer.privacy': 'Privacy',

      'nav.about': 'About',
      'nav.services': 'Services',
      'nav.track': 'Track',
      'nav.contact': 'Contact',
      'nav.getStarted': 'Get started',
      'nav.signIn': 'Sign in',
      'nav.getQuote': 'Get a quote',

      'home.hero.title': 'One Platform. Total Control',
      'home.hero.sub': 'The operating system for transport companies. Drivers, vehicles, compliance, tachographs and maintenance — one connected platform that keeps every mile accountable.',
      'about.hero.title': 'A logistics platform built for proof',
      'about.hero.sub': '256 Logistics connects daily transport work to the evidence that protects your operator licence, your sponsorship, and your business.',
      'services.hero.title': 'Transport services with compliance built in',
      'services.hero.sub': 'From same-day couriers to palletised freight, the same operating spine keeps work visible from first enquiry to signed-off delivery.',
      'contact.hero.title': 'Talk to the transport team',
      'contact.hero.sub': 'Send a quote request, partnership enquiry, or service question — it lands straight in the operations hub.',
      'track.hero.title': 'Track a shipment',
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

      'services.kicker': 'Service catalogue',
      'services.title': 'Pick the lane that fits the load.',
      'services.sub': 'Clear service lanes today, with deeper booking and fulfilment as the platform expands.',
      'service.sameDay.name': 'Same-day delivery', 'service.sameDay.tag': 'Urgent', 'service.sameDay.desc': 'Time-sensitive collections and deliveries with direct operational oversight and live tracking.',
      'service.nextDay.name': 'Next-day delivery', 'service.nextDay.tag': 'Planned', 'service.nextDay.desc': 'Reliable business-to-business movement across regular lanes with confirmed windows.',
      'service.economy.name': 'Economy freight', 'service.economy.tag': 'Value', 'service.economy.desc': 'Cost-conscious consignments planned around efficient capacity and shared routes.',
      'service.pallet.name': 'Pallet &amp; freight', 'service.pallet.tag': 'Freight', 'service.pallet.desc': 'Commercial loads, palletised freight and larger consignment handling.',
      'service.courier.name': 'Courier work', 'service.courier.tag': 'Light', 'service.courier.desc': 'Smaller urgent movements with clear contact and delivery expectations.',
      'service.returns.name': 'Returns &amp; contracts', 'service.returns.tag': 'Recurring', 'service.returns.desc': 'Reverse logistics, recurring routes and contract transport patterns.',

      'trust.security.title': 'Enterprise-grade security.',
      'trust.security.desc': 'Your data is protected, encrypted in transit and at rest, on UK-hosted infrastructure.',
      'trust.powered': 'Powered by',

      'cta.notSure.title': 'Not sure which service you need?',
      'cta.notSure.sub': "Tell us what you're moving and where — we'll recommend the right lane and price it up.",
      'cta.getQuote': 'Get a quote',
      'cta.trackShipment': 'Track a shipment',

      'contact.form.kicker': 'Get in touch',
      'contact.form.title': 'Send an enquiry',
      'contact.form.sub': "Tell us what you need — a member of the transport team will reply by email.",
      'track.form.title': 'Enter a tracking reference',

      'footer.tagline': 'The operating system for transport companies — drivers, vehicles, compliance, tachographs and maintenance in one connected platform.',
      'footer.platformHeading': 'Platform',
      'footer.companyHeading': 'Company',
      'footer.legalHeading': 'Legal',
      'footer.missionVision': 'Mission &amp; vision',
      'footer.partnerships': 'Partnerships',
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
      'footer.about': 'À propos',
      'footer.services': 'Services',
      'footer.contact': 'Contact',
      'footer.track': 'Suivre un envoi',
      'footer.privacy': 'Confidentialité',

      'nav.about': 'À propos',
      'nav.services': 'Services',
      'nav.track': 'Suivi',
      'nav.contact': 'Contact',
      'nav.getStarted': 'Commencer',
      'nav.signIn': 'Se connecter',
      'nav.getQuote': 'Obtenir un devis',

      'home.hero.title': 'Une plateforme. Contrôle total',
      'home.hero.sub': "Le système d'exploitation pour les entreprises de transport. Chauffeurs, véhicules, conformité, tachygraphes et maintenance — une plateforme connectée qui rend chaque kilomètre traçable.",
      'about.hero.title': 'Une plateforme logistique conçue pour la preuve',
      'about.hero.sub': '256 Logistics relie le travail de transport quotidien aux preuves qui protègent votre licence d\'exploitant, votre parrainage et votre entreprise.',
      'services.hero.title': 'Des services de transport avec conformité intégrée',
      'services.hero.sub': "Des coursiers en jour même au fret palettisé, la même colonne vertébrale opérationnelle garde le travail visible, de la première demande à la livraison validée.",
      'contact.hero.title': "Parlez à l'équipe transport",
      'contact.hero.sub': "Envoyez une demande de devis, une demande de partenariat ou une question sur nos services — elle arrive directement au centre des opérations.",
      'track.hero.title': 'Suivre un envoi',
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

      'services.kicker': 'Catalogue de services',
      'services.title': 'Choisissez la voie adaptée à votre charge.',
      'services.sub': "Des voies de service claires dès aujourd'hui, avec réservation et exécution plus poussées à mesure que la plateforme se développe.",
      'service.sameDay.name': 'Livraison le jour même', 'service.sameDay.tag': 'Urgent', 'service.sameDay.desc': 'Enlèvements et livraisons urgents avec supervision opérationnelle directe et suivi en direct.',
      'service.nextDay.name': 'Livraison le lendemain', 'service.nextDay.tag': 'Planifié', 'service.nextDay.desc': 'Mouvement interentreprises fiable sur des voies régulières avec créneaux confirmés.',
      'service.economy.name': 'Fret économique', 'service.economy.tag': 'Valeur', 'service.economy.desc': 'Envois économiques planifiés autour d\'une capacité efficace et de trajets partagés.',
      'service.pallet.name': 'Palette et fret', 'service.pallet.tag': 'Fret', 'service.pallet.desc': 'Charges commerciales, fret palettisé et traitement de plus gros envois.',
      'service.courier.name': 'Travail de coursier', 'service.courier.tag': 'Léger', 'service.courier.desc': 'Mouvements urgents de plus petite taille avec contact clair et attentes de livraison.',
      'service.returns.name': 'Retours et contrats', 'service.returns.tag': 'Récurrent', 'service.returns.desc': 'Logistique inverse, itinéraires récurrents et modèles de transport sous contrat.',

      'trust.security.title': 'Sécurité de niveau professionnel.',
      'trust.security.desc': 'Vos données sont protégées, chiffrées en transit et au repos, sur une infrastructure hébergée au Royaume-Uni.',
      'trust.powered': 'Propulsé par',

      'cta.notSure.title': 'Vous ne savez pas quel service vous convient ?',
      'cta.notSure.sub': "Dites-nous ce que vous transportez et où — nous vous recommanderons la bonne voie et son prix.",
      'cta.getQuote': 'Obtenir un devis',
      'cta.trackShipment': 'Suivre un envoi',

      'contact.form.kicker': 'Contactez-nous',
      'contact.form.title': 'Envoyer une demande',
      'contact.form.sub': "Dites-nous ce dont vous avez besoin — un membre de l'équipe transport vous répondra par e-mail.",
      'track.form.title': 'Saisissez une référence de suivi',

      'footer.tagline': "Le système d'exploitation pour les entreprises de transport — chauffeurs, véhicules, conformité, tachygraphes et maintenance sur une seule plateforme connectée.",
      'footer.platformHeading': 'Plateforme',
      'footer.companyHeading': 'Entreprise',
      'footer.legalHeading': 'Mentions légales',
      'footer.missionVision': 'Mission et vision',
      'footer.partnerships': 'Partenariats',
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
      'footer.about': 'Acerca de',
      'footer.services': 'Servicios',
      'footer.contact': 'Contacto',
      'footer.track': 'Rastrear un envío',
      'footer.privacy': 'Privacidad',

      'nav.about': 'Acerca de',
      'nav.services': 'Servicios',
      'nav.track': 'Rastrear',
      'nav.contact': 'Contacto',
      'nav.getStarted': 'Comenzar',
      'nav.signIn': 'Iniciar sesión',
      'nav.getQuote': 'Solicitar presupuesto',

      'home.hero.title': 'Una plataforma. Control total',
      'home.hero.sub': 'El sistema operativo para empresas de transporte. Conductores, vehículos, cumplimiento, tacógrafos y mantenimiento — una plataforma conectada que responsabiliza cada kilómetro.',
      'about.hero.title': 'Una plataforma logística creada para la evidencia',
      'about.hero.sub': '256 Logistics conecta el trabajo de transporte diario con la evidencia que protege su licencia de operador, su patrocinio y su negocio.',
      'services.hero.title': 'Servicios de transporte con cumplimiento integrado',
      'services.hero.sub': 'Desde mensajería en el mismo día hasta carga paletizada, la misma columna operativa mantiene el trabajo visible desde la primera consulta hasta la entrega firmada.',
      'contact.hero.title': 'Hable con el equipo de transporte',
      'contact.hero.sub': 'Envíe una solicitud de presupuesto, consulta de asociación o pregunta sobre servicios — llega directamente al centro de operaciones.',
      'track.hero.title': 'Rastrear un envío',
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

      'services.kicker': 'Catálogo de servicios',
      'services.title': 'Elija el carril adecuado para su carga.',
      'services.sub': 'Carriles de servicio claros desde hoy, con reserva y cumplimiento más profundos a medida que la plataforma crece.',
      'service.sameDay.name': 'Entrega el mismo día', 'service.sameDay.tag': 'Urgente', 'service.sameDay.desc': 'Recogidas y entregas urgentes con supervisión operativa directa y seguimiento en vivo.',
      'service.nextDay.name': 'Entrega al día siguiente', 'service.nextDay.tag': 'Planificado', 'service.nextDay.desc': 'Movimiento fiable entre empresas en carriles regulares con ventanas confirmadas.',
      'service.economy.name': 'Carga económica', 'service.economy.tag': 'Valor', 'service.economy.desc': 'Envíos económicos planificados en torno a capacidad eficiente y rutas compartidas.',
      'service.pallet.name': 'Palet y carga', 'service.pallet.tag': 'Carga', 'service.pallet.desc': 'Cargas comerciales, carga paletizada y manejo de envíos de mayor tamaño.',
      'service.courier.name': 'Trabajo de mensajería', 'service.courier.tag': 'Ligero', 'service.courier.desc': 'Movimientos urgentes de menor tamaño con contacto claro y expectativas de entrega.',
      'service.returns.name': 'Devoluciones y contratos', 'service.returns.tag': 'Recurrente', 'service.returns.desc': 'Logística inversa, rutas recurrentes y patrones de transporte por contrato.',

      'trust.security.title': 'Seguridad de nivel empresarial.',
      'trust.security.desc': 'Sus datos están protegidos, cifrados en tránsito y en reposo, en infraestructura alojada en el Reino Unido.',
      'trust.powered': 'Desarrollado por',

      'cta.notSure.title': '¿No está seguro de qué servicio necesita?',
      'cta.notSure.sub': 'Cuéntenos qué mueve y a dónde — le recomendaremos el carril adecuado y le daremos un precio.',
      'cta.getQuote': 'Solicitar presupuesto',
      'cta.trackShipment': 'Rastrear un envío',

      'contact.form.kicker': 'Póngase en contacto',
      'contact.form.title': 'Enviar una consulta',
      'contact.form.sub': 'Cuéntenos qué necesita — un miembro del equipo de transporte responderá por correo electrónico.',
      'track.form.title': 'Introduzca una referencia de seguimiento',

      'footer.tagline': 'El sistema operativo para empresas de transporte — conductores, vehículos, cumplimiento, tacógrafos y mantenimiento en una plataforma conectada.',
      'footer.platformHeading': 'Plataforma',
      'footer.companyHeading': 'Empresa',
      'footer.legalHeading': 'Legal',
      'footer.missionVision': 'Misión y visión',
      'footer.partnerships': 'Alianzas',
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
      'footer.about': 'Sobre',
      'footer.services': 'Serviços',
      'footer.contact': 'Contacto',
      'footer.track': 'Rastrear uma remessa',
      'footer.privacy': 'Privacidade',

      'nav.about': 'Sobre',
      'nav.services': 'Serviços',
      'nav.track': 'Rastrear',
      'nav.contact': 'Contacto',
      'nav.getStarted': 'Começar',
      'nav.signIn': 'Iniciar sessão',
      'nav.getQuote': 'Pedir orçamento',

      'home.hero.title': 'Uma plataforma. Controlo total',
      'home.hero.sub': 'O sistema operativo para empresas de transporte. Motoristas, veículos, conformidade, tacógrafos e manutenção — uma plataforma conectada que torna cada quilómetro responsável.',
      'about.hero.title': 'Uma plataforma de logística criada para a prova',
      'about.hero.sub': 'A 256 Logistics liga o trabalho de transporte diário às provas que protegem a sua licença de operador, o seu patrocínio e o seu negócio.',
      'services.hero.title': 'Serviços de transporte com conformidade integrada',
      'services.hero.sub': 'De estafetas no mesmo dia a carga paletizada, a mesma espinha operacional mantém o trabalho visível desde o primeiro pedido até à entrega validada.',
      'contact.hero.title': 'Fale com a equipa de transporte',
      'contact.hero.sub': 'Envie um pedido de orçamento, uma consulta de parceria ou uma pergunta sobre serviços — chega diretamente ao centro de operações.',
      'track.hero.title': 'Rastrear uma remessa',
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

      'services.kicker': 'Catálogo de serviços',
      'services.title': 'Escolha a via certa para a sua carga.',
      'services.sub': 'Vias de serviço claras desde já, com reserva e cumprimento mais aprofundados à medida que a plataforma cresce.',
      'service.sameDay.name': 'Entrega no mesmo dia', 'service.sameDay.tag': 'Urgente', 'service.sameDay.desc': 'Recolhas e entregas sensíveis ao tempo com supervisão operacional direta e rastreio em direto.',
      'service.nextDay.name': 'Entrega no dia seguinte', 'service.nextDay.tag': 'Planeado', 'service.nextDay.desc': 'Movimento fiável entre empresas em vias regulares com janelas confirmadas.',
      'service.economy.name': 'Frete económico', 'service.economy.tag': 'Valor', 'service.economy.desc': 'Consignações económicas planeadas em torno de capacidade eficiente e rotas partilhadas.',
      'service.pallet.name': 'Palete e frete', 'service.pallet.tag': 'Frete', 'service.pallet.desc': 'Cargas comerciais, frete paletizado e manuseamento de consignações maiores.',
      'service.courier.name': 'Trabalho de estafeta', 'service.courier.tag': 'Leve', 'service.courier.desc': 'Movimentos urgentes de menor dimensão com contacto claro e expectativas de entrega.',
      'service.returns.name': 'Devoluções e contratos', 'service.returns.tag': 'Recorrente', 'service.returns.desc': 'Logística inversa, rotas recorrentes e padrões de transporte contratual.',

      'trust.security.title': 'Segurança de nível empresarial.',
      'trust.security.desc': 'Os seus dados estão protegidos, encriptados em trânsito e em repouso, em infraestrutura alojada no Reino Unido.',
      'trust.powered': 'Desenvolvido por',

      'cta.notSure.title': 'Não sabe de que serviço precisa?',
      'cta.notSure.sub': 'Diga-nos o que está a mover e para onde — recomendamos a via certa e o respetivo preço.',
      'cta.getQuote': 'Pedir orçamento',
      'cta.trackShipment': 'Rastrear uma remessa',

      'contact.form.kicker': 'Entre em contacto',
      'contact.form.title': 'Enviar um pedido',
      'contact.form.sub': 'Diga-nos do que precisa — um membro da equipa de transporte responderá por e-mail.',
      'track.form.title': 'Introduza uma referência de rastreio',

      'footer.tagline': 'O sistema operativo para empresas de transporte — motoristas, veículos, conformidade, tacógrafos e manutenção numa única plataforma conectada.',
      'footer.platformHeading': 'Plataforma',
      'footer.companyHeading': 'Empresa',
      'footer.legalHeading': 'Legal',
      'footer.missionVision': 'Missão e visão',
      'footer.partnerships': 'Parcerias',
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
