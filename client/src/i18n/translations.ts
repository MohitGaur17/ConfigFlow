export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'ar';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.allTasks': 'All Tasks',
    'nav.newTask': 'New Task',
    'nav.dashboard': 'Dashboard',
    'nav.language': 'Language',
    'nav.logout': 'Logout',
    'nav.generatedApp': 'Generated App',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': 'Generate full-stack applications with dynamic UI, APIs, authentication, and extensible data models.',
    'header.status': 'PWA ready',
    'header.brand': 'ConfigFlow',
    'header.tagline': 'Config driven AI App Generator',

    // Home Page
    'home.overview': 'Overview',
    'home.title': 'ConfigFlow',
    'home.subtitle': 'Get a Full-Stack App.',
    'home.responsive': 'Responsive',
    'home.responsiveDesc': 'Mobile first',
    'home.installable': 'Installable',
    'home.installableDesc': 'PWA ready',
    'home.newApplication': 'New Application',
    'home.newApplicationDesc': 'Generate, deploy, install',
    'home.layout': 'Responsive layout',
    'home.layoutDesc': 'Sidebar on desktop, bottom nav on mobile',
    'home.offline': 'Offline ready',
    'home.offlineDesc': 'Manifest + service worker',
    'home.dataDriven': 'Data driven',
    'home.dataDrivenDesc': 'Entity pages scale to your config',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': 'Dynamic schemas',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'Responsive UI',
    'home.featureExport': 'Export Code',
    'home.featureExportDesc': 'Download ZIP',

    // All Tasks Page
    'tasks.allTasks': 'All Tasks',
    'tasks.search': 'Search records',
    'tasks.add': 'Add',
    'tasks.loading': 'Loading data...',
    'tasks.noRecords': 'No records found.',
    'tasks.actions': 'Actions',

    // New Task Page
    'newTask.title': 'New Task',
    'newTask.create': 'Create Task',
    'newTask.form': 'Task Form',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.stats': 'Statistics',
    'dashboard.recentTasks': 'Recent Tasks',

    // Authentication
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.name': 'Full Name',
    'auth.fullName': 'Enter your full name',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.signup': 'Sign Up',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.forgotPassword': 'Forgot password?',
    'auth.rememberMe': 'Remember me',
    'auth.loading': 'Loading...',
    'auth.signInDescription': 'Log in to your account to access your apps',
    'auth.passwordMismatch': 'Passwords do not match',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.loading': 'Loading',
    'common.noData': 'No data available',
    'common.created': 'Created',
    'common.back': 'Back',

    // PWA Install Prompt
    'pwa.installTitle': 'Install ConfigFlow',
    'pwa.installDescription': 'Access your apps offline and from your home screen.',
    'pwa.installButton': 'Install Now',
  },

  es: {
    // Navigation
    'nav.allTasks': 'Todas las Tareas',
    'nav.newTask': 'Nueva Tarea',
    'nav.dashboard': 'Panel de Control',
    'nav.language': 'Idioma',
    'nav.logout': 'Cerrar Sesión',
    'nav.generatedApp': 'Aplicación Generada',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': 'Genera aplicaciones full-stack con UI dinámica, APIs, autenticación y modelos de datos extensibles.',
    'header.status': 'Lista para PWA',
    'header.brand': 'ConfigFlow',
    'header.tagline': 'Generador de Aplicaciones de IA Impulsado por Configuración',

    // Home Page
    'home.overview': 'Descripción General',
    'home.title': 'ConfigFlow',
    'home.subtitle': 'Obtén una aplicación web completa.',
    'home.responsive': 'Responsive',
    'home.responsiveDesc': 'Primero móvil',
    'home.installable': 'Instalable',
    'home.installableDesc': 'Lista para PWA',
    'home.newApplication': 'Nueva Aplicación',
    'home.newApplicationDesc': 'Generar, implementar, instalar',
    'home.layout': 'Diseño Responsive',
    'home.layoutDesc': 'Barra lateral en desktop, navegación inferior en móvil',
    'home.offline': 'Listo para Offline',
    'home.offlineDesc': 'Manifest + service worker',
    'home.dataDriven': 'Impulsado por Datos',
    'home.dataDrivenDesc': 'Las páginas de entidad se escalan a su configuración',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': 'Esquemas dinámicos',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'Interfaz adaptable',
    'home.featureExport': 'Exportar código',
    'home.featureExportDesc': 'Descargar ZIP',

    // All Tasks Page
    'tasks.allTasks': 'Todas las Tareas',
    'tasks.search': 'Buscar registros',
    'tasks.add': 'Agregar',
    'tasks.loading': 'Cargando datos...',
    'tasks.noRecords': 'No se encontraron registros.',
    'tasks.actions': 'Acciones',

    // New Task Page
    'newTask.title': 'Nueva Tarea',
    'newTask.create': 'Crear Tarea',
    'newTask.form': 'Formulario de Tarea',

    // Dashboard
    'dashboard.title': 'Panel de Control',
    'dashboard.welcome': 'Bienvenido de vuelta',
    'dashboard.stats': 'Estadísticas',
    'dashboard.recentTasks': 'Tareas Recientes',

    // Authentication
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.name': 'Nombre Completo',
    'auth.fullName': 'Ingresa tu nombre completo',
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Registrarse',
    'auth.signup': 'Registrarse',
    'auth.haveAccount': '¿Ya tienes cuenta?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.forgotPassword': '¿Olvidaste la contraseña?',
    'auth.rememberMe': 'Recuérdame',
    'auth.loading': 'Cargando...',
    'auth.signInDescription': 'Inicia sesión en tu cuenta para acceder a tus aplicaciones',
    'auth.passwordMismatch': 'Las contraseñas no coinciden',

    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.close': 'Cerrar',
    'common.confirm': 'Confirmar',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.loading': 'Cargando',
    'common.noData': 'Sin datos disponibles',
    'common.created': 'Creado',
    'common.back': 'Atrás',

    // PWA Install Prompt
    'pwa.installTitle': 'Instalar ConfigFlow',
    'pwa.installDescription': 'Accede a tus aplicaciones sin conexión y desde la pantalla de inicio.',
    'pwa.installButton': 'Instalar Ahora',
  },

  fr: {
    // Navigation
    'nav.allTasks': 'Toutes les Tâches',
    'nav.newTask': 'Nouvelle Tâche',
    'nav.dashboard': 'Tableau de Bord',
    'nav.language': 'Langue',
    'nav.logout': 'Déconnexion',
    'nav.generatedApp': 'Application Générée',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': 'Générez des applications full-stack avec UI dynamique, API, authentification et modèles de données extensibles.',
    'header.status': 'Prêt pour PWA',
    'header.brand': 'ConfigFlow',
    'header.tagline': 'Générateur d\'Applications IA Piloté par Configuration',

    // Home Page
    'home.overview': 'Aperçu',
    'home.title': 'ConfigFlow',
    'home.subtitle': 'Obtenez une application complète.',
    'home.responsive': 'Réactif',
    'home.responsiveDesc': 'Mobile d\'abord',
    'home.installable': 'Installable',
    'home.installableDesc': 'Prêt pour PWA',
    'home.newApplication': 'Nouvelle Application',
    'home.newApplicationDesc': 'Générer, déployer, installer',
    'home.layout': 'Mise en Page Réactive',
    'home.layoutDesc': 'Barre latérale sur desktop, navigation inférieure sur mobile',
    'home.offline': 'Prêt pour le Hors Ligne',
    'home.offlineDesc': 'Manifest + service worker',
    'home.dataDriven': 'Piloté par les Données',
    'home.dataDrivenDesc': 'Les pages d\'entité s\'adaptent à votre configuration',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': 'Schémas dynamiques',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'Interface responsive',
    'home.featureExport': 'Exporter le code',
    'home.featureExportDesc': 'Télécharger le ZIP',

    // All Tasks Page
    'tasks.allTasks': 'Toutes les Tâches',
    'tasks.search': 'Rechercher les enregistrements',
    'tasks.add': 'Ajouter',
    'tasks.loading': 'Chargement des données...',
    'tasks.noRecords': 'Aucun enregistrement trouvé.',
    'tasks.actions': 'Actions',

    // New Task Page
    'newTask.title': 'Nouvelle Tâche',
    'newTask.create': 'Créer une Tâche',
    'newTask.form': 'Formulaire de Tâche',

    // Dashboard
    'dashboard.title': 'Tableau de Bord',
    'dashboard.welcome': 'Bienvenue',
    'dashboard.stats': 'Statistiques',
    'dashboard.recentTasks': 'Tâches Récentes',

    // Authentication
    'auth.email': 'Adresse E-mail',
    'auth.password': 'Mot de Passe',
    'auth.confirmPassword': 'Confirmer le Mot de Passe',
    'auth.name': 'Nom Complet',
    'auth.fullName': 'Entrez votre nom complet',
    'auth.login': 'Connexion',
    'auth.register': 'S\'inscrire',
    'auth.signup': 'S\'inscrire',
    'auth.haveAccount': 'Vous avez déjà un compte?',
    'auth.noAccount': 'Vous n\'avez pas de compte?',
    'auth.forgotPassword': 'Mot de passe oublié?',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.loading': 'Chargement...',
    'auth.signInDescription': 'Connectez-vous à votre compte pour accéder à vos applications',
    'auth.passwordMismatch': 'Les mots de passe ne correspondent pas',

    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.close': 'Fermer',
    'common.confirm': 'Confirmer',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.loading': 'Chargement',
    'common.noData': 'Aucune donnée disponible',
    'common.created': 'Créé',
    'common.back': 'Retour',

    // PWA Install Prompt
    'pwa.installTitle': 'Installer ConfigFlow',
    'pwa.installDescription': 'Accédez à vos applications hors ligne et depuis votre écran d\'accueil.',
    'pwa.installButton': 'Installer Maintenant',
  },

  de: {
    // Navigation
    'nav.allTasks': 'Alle Aufgaben',
    'nav.newTask': 'Neue Aufgabe',
    'nav.dashboard': 'Dashboard',
    'nav.language': 'Sprache',
    'nav.logout': 'Abmelden',
    'nav.generatedApp': 'Generierte App',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': 'Erstellen Sie Full-Stack-Anwendungen mit dynamischer UI, APIs, Authentifizierung und erweiterbaren Datenmodellen.',
    'header.status': 'PWA bereit',
    'header.brand': 'ConfigFlow',
    'header.tagline': 'Konfigurationsgesteuerte KI-App-Generator',

    // Home Page
    'home.overview': 'Übersicht',
    'home.title': 'ConfigFlow',
    'home.subtitle': 'Erstellen Sie eine komplette Webanwendung.',
    'home.responsive': 'Responsiv',
    'home.responsiveDesc': 'Mobil zuerst',
    'home.installable': 'Installierbar',
    'home.installableDesc': 'PWA bereit',
    'home.newApplication': 'Neue Anwendung',
    'home.newApplicationDesc': 'Generieren, bereitstellen, installieren',
    'home.layout': 'Responsives Layout',
    'home.layoutDesc': 'Seitenleiste auf Desktop, untere Navigation auf Mobilgeräten',
    'home.offline': 'Offline bereit',
    'home.offlineDesc': 'Manifest + Service Worker',
    'home.dataDriven': 'Datengesteuert',
    'home.dataDrivenDesc': 'Entity-Seiten skalieren mit Ihrer Konfiguration',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': 'Dynamische Schemata',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'Responsive Oberfläche',
    'home.featureExport': 'Code exportieren',
    'home.featureExportDesc': 'ZIP herunterladen',

    // All Tasks Page
    'tasks.allTasks': 'Alle Aufgaben',
    'tasks.search': 'Datensätze durchsuchen',
    'tasks.add': 'Hinzufügen',
    'tasks.loading': 'Daten werden geladen...',
    'tasks.noRecords': 'Keine Datensätze gefunden.',
    'tasks.actions': 'Aktionen',

    // New Task Page
    'newTask.title': 'Neue Aufgabe',
    'newTask.create': 'Aufgabe erstellen',
    'newTask.form': 'Aufgabenformular',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Willkommen zurück',
    'dashboard.stats': 'Statistiken',
    'dashboard.recentTasks': 'Aktuelle Aufgaben',

    // Authentication
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort Bestätigen',
    'auth.name': 'Vollständiger Name',
    'auth.fullName': 'Geben Sie Ihren vollständigen Namen ein',
    'auth.login': 'Anmelden',
    'auth.register': 'Registrieren',
    'auth.signup': 'Registrieren',
    'auth.haveAccount': 'Sie haben bereits ein Konto?',
    'auth.noAccount': 'Sie haben noch kein Konto?',
    'auth.forgotPassword': 'Passwort vergessen?',
    'auth.rememberMe': 'Mich merken',
    'auth.loading': 'Wird geladen...',
    'auth.signInDescription': 'Melden Sie sich bei Ihrem Konto an, um auf Ihre Apps zuzugreifen',
    'auth.passwordMismatch': 'Passwörter stimmen nicht überein',

    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
    'common.confirm': 'Bestätigen',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.loading': 'Wird geladen',
    'common.noData': 'Keine Daten verfügbar',
    'common.created': 'Erstellt',
    'common.back': 'Zurück',

    // PWA Install Prompt
    'pwa.installTitle': 'ConfigFlow installieren',
    'pwa.installDescription': 'Greifen Sie offline auf Ihre Apps zu und installieren Sie sie auf Ihrem Startbildschirm.',
    'pwa.installButton': 'Jetzt Installieren',
  },

  ja: {
    // Navigation
    'nav.allTasks': 'すべてのタスク',
    'nav.newTask': '新しいタスク',
    'nav.dashboard': 'ダッシュボード',
    'nav.language': '言語',
    'nav.logout': 'ログアウト',
    'nav.generatedApp': '生成されたアプリ',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': '動的な UI、API、認証、拡張可能なデータモデルを備えたフルスタックアプリを生成します。',
    'header.status': 'PWA対応',
    'header.brand': 'ConfigFlow',
    'header.tagline': '設定駆動型AIアプリジェネレーター',

    // Home Page
    'home.overview': '概要',
    'home.title': 'ConfigFlow',
    'home.subtitle': '完全なWebアプリを作成できます。',
    'home.responsive': 'レスポンシブ',
    'home.responsiveDesc': 'モバイルファースト',
    'home.installable': 'インストール可能',
    'home.installableDesc': 'PWA対応',
    'home.newApplication': '新しいアプリケーション',
    'home.newApplicationDesc': '生成、デプロイ、インストール',
    'home.layout': 'レスポンシブレイアウト',
    'home.layoutDesc': 'デスクトップではサイドバー、モバイルではボトムナビ',
    'home.offline': 'オフライン対応',
    'home.offlineDesc': 'Manifest + Service Worker',
    'home.dataDriven': 'データドリブン',
    'home.dataDrivenDesc': 'エンティティページが設定に応じてスケーリング',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': '動的スキーマ',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'レスポンシブ UI',
    'home.featureExport': 'コードを書き出す',
    'home.featureExportDesc': 'ZIP をダウンロード',

    // All Tasks Page
    'tasks.allTasks': 'すべてのタスク',
    'tasks.search': 'レコード検索',
    'tasks.add': '追加',
    'tasks.loading': 'データを読み込み中...',
    'tasks.noRecords': 'レコードが見つかりません。',
    'tasks.actions': 'アクション',

    // New Task Page
    'newTask.title': '新しいタスク',
    'newTask.create': 'タスクを作成',
    'newTask.form': 'タスクフォーム',

    // Dashboard
    'dashboard.title': 'ダッシュボード',
    'dashboard.welcome': 'おかえりなさい',
    'dashboard.stats': '統計',
    'dashboard.recentTasks': '最近のタスク',

    // Authentication
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.confirmPassword': 'パスワード確認',
    'auth.name': 'フルネーム',
    'auth.fullName': 'フルネームを入力してください',
    'auth.login': 'ログイン',
    'auth.register': '登録',
    'auth.signup': '登録',
    'auth.haveAccount': 'すでにアカウントをお持ちですか？',
    'auth.noAccount': 'アカウントをお持ちでないですか？',
    'auth.forgotPassword': 'パスワードをお忘れですか？',
    'auth.rememberMe': 'パスワードを記憶する',
    'auth.loading': '読み込み中...',
    'auth.signInDescription': 'アカウントにログインしてアプリにアクセスします',
    'auth.passwordMismatch': 'パスワードが一致しません',

    // Common
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.close': '閉じる',
    'common.confirm': '確認',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.loading': '読み込み中',
    'common.noData': 'データがありません',
    'common.created': '作成日',
    'common.back': '戻る',

    // PWA Install Prompt
    'pwa.installTitle': 'ConfigFlowをインストール',
    'pwa.installDescription': 'アプリをオフラインで使用できます。ホーム画面に追加できます。',
    'pwa.installButton': '今すぐインストール',
  },

  zh: {
    // Navigation
    'nav.allTasks': '所有任务',
    'nav.newTask': '新任务',
    'nav.dashboard': '仪表板',
    'nav.language': '语言',
    'nav.logout': '登出',
    'nav.generatedApp': '生成的应用',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': '生成具有动态 UI、API、身份验证和可扩展数据模型的全栈应用程序。',
    'header.status': 'PWA就绪',
    'header.brand': 'ConfigFlow',
    'header.tagline': '配置驱动型AI应用生成器',

    // Home Page
    'home.overview': '概览',
    'home.title': 'ConfigFlow',
    'home.subtitle': '创建一个完整的 Web 应用。',
    'home.responsive': '响应式',
    'home.responsiveDesc': '移动优先',
    'home.installable': '可安装',
    'home.installableDesc': 'PWA就绪',
    'home.newApplication': '新应用',
    'home.newApplicationDesc': '生成、部署、安装',
    'home.layout': '响应式布局',
    'home.layoutDesc': '桌面显示侧边栏，移动设备显示底部导航',
    'home.offline': '离线就绪',
    'home.offlineDesc': 'Manifest + Service Worker',
    'home.dataDriven': '数据驱动',
    'home.dataDrivenDesc': '实体页面根据您的配置进行扩展',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': '动态架构',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': '响应式界面',
    'home.featureExport': '导出代码',
    'home.featureExportDesc': '下载 ZIP',

    // All Tasks Page
    'tasks.allTasks': '所有任务',
    'tasks.search': '搜索记录',
    'tasks.add': '添加',
    'tasks.loading': '正在加载数据...',
    'tasks.noRecords': '未找到记录。',
    'tasks.actions': '操作',

    // New Task Page
    'newTask.title': '新任务',
    'newTask.create': '创建任务',
    'newTask.form': '任务表单',

    // Dashboard
    'dashboard.title': '仪表板',
    'dashboard.welcome': '欢迎回来',
    'dashboard.stats': '统计数据',
    'dashboard.recentTasks': '最近的任务',

    // Authentication
    'auth.email': '电子邮件',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.name': '全名',
    'auth.fullName': '请输入您的全名',
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.signup': '注册',
    'auth.haveAccount': '已有账户？',
    'auth.noAccount': '没有账户？',
    'auth.forgotPassword': '忘记密码？',
    'auth.rememberMe': '记住我',
    'auth.loading': '加载中...',
    'auth.signInDescription': '登录您的账户以访问您的应用程序',
    'auth.passwordMismatch': '密码不匹配',

    // Common
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.close': '关闭',
    'common.confirm': '确认',
    'common.error': '错误',
    'common.success': '成功',
    'common.loading': '加载中',
    'common.noData': '无可用数据',
    'common.created': '创建于',
    'common.back': '返回',

    // PWA Install Prompt
    'pwa.installTitle': '安装ConfigFlow',
    'pwa.installDescription': '可以离线访问您的应用，并从主屏幕快速启动。',
    'pwa.installButton': '立即安装',
  },

  pt: {
    // Navigation
    'nav.allTasks': 'Todas as Tarefas',
    'nav.newTask': 'Nova Tarefa',
    'nav.dashboard': 'Painel',
    'nav.language': 'Idioma',
    'nav.logout': 'Sair',
    'nav.generatedApp': 'Aplicativo Gerado',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': 'Gere aplicações full-stack com UI dinâmica, APIs, autenticação e modelos de dados extensíveis.',
    'header.status': 'PWA pronto',
    'header.brand': 'ConfigFlow',
    'header.tagline': 'Gerador de Aplicativos de IA Orientado por Configuração',

    // Home Page
    'home.overview': 'Visão Geral',
    'home.title': 'ConfigFlow',
    'home.subtitle': 'Obtenha uma aplicação web completa.',
    'home.responsive': 'Responsivo',
    'home.responsiveDesc': 'Móvel em primeiro lugar',
    'home.installable': 'Instalável',
    'home.installableDesc': 'PWA pronto',
    'home.newApplication': 'Nova Aplicação',
    'home.newApplicationDesc': 'Gerar, implantar, instalar',
    'home.layout': 'Layout Responsivo',
    'home.layoutDesc': 'Barra lateral no desktop, navegação inferior em dispositivos móveis',
    'home.offline': 'Pronto para Offline',
    'home.offlineDesc': 'Manifest + Service Worker',
    'home.dataDriven': 'Orientado por Dados',
    'home.dataDrivenDesc': 'As páginas de entidade dimensionam de acordo com sua configuração',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': 'Esquemas dinâmicos',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'Interface responsiva',
    'home.featureExport': 'Exportar código',
    'home.featureExportDesc': 'Baixar ZIP',

    // All Tasks Page
    'tasks.allTasks': 'Todas as Tarefas',
    'tasks.search': 'Pesquisar registros',
    'tasks.add': 'Adicionar',
    'tasks.loading': 'Carregando dados...',
    'tasks.noRecords': 'Nenhum registro encontrado.',
    'tasks.actions': 'Ações',

    // New Task Page
    'newTask.title': 'Nova Tarefa',
    'newTask.create': 'Criar Tarefa',
    'newTask.form': 'Formulário de Tarefa',

    // Dashboard
    'dashboard.title': 'Painel',
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.stats': 'Estatísticas',
    'dashboard.recentTasks': 'Tarefas Recentes',

    // Authentication
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.confirmPassword': 'Confirmar Senha',
    'auth.name': 'Nome Completo',
    'auth.fullName': 'Digite seu nome completo',
    'auth.login': 'Entrar',
    'auth.register': 'Registrar',
    'auth.signup': 'Registrar-se',
    'auth.haveAccount': 'Já tem uma conta?',
    'auth.noAccount': 'Não tem uma conta?',
    'auth.forgotPassword': 'Esqueceu a senha?',
    'auth.rememberMe': 'Lembre-se de mim',
    'auth.loading': 'Carregando...',
    'auth.signInDescription': 'Faça login em sua conta para acessar seus aplicativos',
    'auth.passwordMismatch': 'As senhas não correspondem',

    // Common
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.close': 'Fechar',
    'common.confirm': 'Confirmar',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.loading': 'Carregando',
    'common.noData': 'Sem dados disponíveis',
    'common.created': 'Criado',
    'common.back': 'Voltar',

    // PWA Install Prompt
    'pwa.installTitle': 'Instalar ConfigFlow',
    'pwa.installDescription': 'Acesse seus aplicativos offline e a partir da tela inicial.',
    'pwa.installButton': 'Instalar Agora',
  },

  ar: {
    // Navigation
    'nav.allTasks': 'جميع المهام',
    'nav.newTask': 'مهمة جديدة',
    'nav.dashboard': 'لوحة التحكم',
    'nav.language': 'اللغة',
    'nav.logout': 'تسجيل الخروج',
    'nav.generatedApp': 'التطبيق المنتج',

    // Headers
    'header.title': 'ConfigFlow',
    'header.description': 'أنشئ تطبيقات ويب كاملة بواجهات ديناميكية وواجهات برمجة تطبيقات ومصادقة ونماذج بيانات قابلة للتوسعة.',
    'header.status': 'PWA جاهز',
    'header.brand': 'ConfigFlow',
    'header.tagline': 'مولد تطبيقات الذكاء الاصطناعي المدفوع بالإعدادات',

    // Home Page
    'home.overview': 'نظرة عامة',
    'home.title': 'ConfigFlow',
    'home.subtitle': 'أنشئ تطبيق ويب كامل ومتكامل.',
    'home.responsive': 'سريع الاستجابة',
    'home.responsiveDesc': 'الهاتف أولاً',
    'home.installable': 'قابل للتثبيت',
    'home.installableDesc': 'PWA جاهز',
    'home.newApplication': 'تطبيق جديد',
    'home.newApplicationDesc': 'إنشاء، نشر، تثبيت',
    'home.layout': 'تخطيط سريع الاستجابة',
    'home.layoutDesc': 'شريط جانبي على سطح المكتب، التنقل السفلي على الأجهزة المحمولة',
    'home.offline': 'جاهز للعمل دون اتصال',
    'home.offlineDesc': 'Manifest + خادم الخدمة',
    'home.dataDriven': 'تحكمه البيانات',
    'home.dataDrivenDesc': 'تتكيف صفحات الكيان مع إعدادك',
    'home.featureDatabase': 'PostgreSQL',
    'home.featureDatabaseDesc': 'مخططات ديناميكية',
    'home.featureNext': 'Next.js',
    'home.featureNextDesc': 'واجهة متجاوبة',
    'home.featureExport': 'تصدير الكود',
    'home.featureExportDesc': 'تنزيل ZIP',

    // All Tasks Page
    'tasks.allTasks': 'جميع المهام',
    'tasks.search': 'البحث في السجلات',
    'tasks.add': 'إضافة',
    'tasks.loading': 'جاري تحميل البيانات...',
    'tasks.noRecords': 'لم يتم العثور على سجلات.',
    'tasks.actions': 'الإجراءات',

    // New Task Page
    'newTask.title': 'مهمة جديدة',
    'newTask.create': 'إنشاء مهمة',
    'newTask.form': 'نموذج المهمة',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'أهلا بعودتك',
    'dashboard.stats': 'الإحصائيات',
    'dashboard.recentTasks': 'المهام الأخيرة',

    // Authentication
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.fullName': 'أدخل اسمك الكامل',
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'تسجيل',
    'auth.signup': 'التسجيل',
    'auth.haveAccount': 'هل لديك حساب بالفعل؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.forgotPassword': 'هل نسيت كلمة المرور؟',
    'auth.rememberMe': 'تذكرني',
    'auth.loading': 'جاري التحميل...',
    'auth.signInDescription': 'قم بتسجيل الدخول إلى حسابك للوصول إلى تطبيقاتك',
    'auth.passwordMismatch': 'كلمات المرور غير متطابقة',

    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تحرير',
    'common.close': 'إغلاق',
    'common.confirm': 'تأكيد',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.loading': 'جاري التحميل',
    'common.noData': 'لا توجد بيانات متاحة',
    'common.created': 'تم الإنشاء',
    'common.back': 'العودة',

    // PWA Install Prompt
    'pwa.installTitle': 'تثبيت ConfigFlow',
    'pwa.installDescription': 'قم بالوصول إلى تطبيقاتك دون اتصال بالإنترنت ومن شاشتك الرئيسية.',
    'pwa.installButton': 'ثبت الآن',
  },
};

export const languages: Array<{ code: Language; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export const DEFAULT_LANGUAGE: Language = 'en';
