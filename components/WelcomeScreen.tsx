import React, { useState, useRef, useEffect } from 'react';
import type { Language } from '../types';
import { Spinner } from './Spinner';

interface WelcomeScreenProps {
  onStart: () => void;
  onBack?: () => void;
  language: Language;
  setLanguage?: (lang: Language) => void;
}

const COVER_METADATA = [
  {
    src: '/covers/cover2.png',
    title: { ar: 'ساعة السفر عبر الزمن', en: 'The Time-Traveling Watch' },
    subtitle: { ar: 'رحلة استكشاف الماضي والمستقبل العجيب', en: 'Journey Across Past & Future Wonders' },
    category: { ar: 'خيال علمي', en: 'Sci-Fi & Time' },
    accent: '#F78F50'
  },
  {
    src: '/covers/cover3.png',
    title: { ar: 'أسرار الصحراء', en: 'Secrets of the Desert' },
    subtitle: { ar: 'مغامرة الواحة الذهبية ورمال الشرق', en: 'Golden Oasis & Desert Sands Adventure' },
    category: { ar: 'مغامرة وتراث', en: 'Heritage & Adventure' },
    accent: '#006B5D'
  },
  {
    src: '/covers/cover4.png',
    title: { ar: 'مغامرة الفضاء', en: 'The Space Adventure' },
    subtitle: { ar: 'انطلاق الصاروخ نحو القمر والكواكب', en: 'Rocket Blast to the Moon & Planets' },
    category: { ar: 'فضاء وعلوم', en: 'Space & Wonder' },
    accent: '#4B6A15'
  },
  {
    src: '/covers/cover5.png',
    title: { ar: 'مفاجأة الديناصور', en: 'The Dino Surprise' },
    subtitle: { ar: 'صديق صغير لطيف من عالم ما قبل التاريخ', en: 'A Friendly Little Prehistoric Companion' },
    category: { ar: 'عالم الديناصورات', en: 'Dino World' },
    accent: '#8F5A1D'
  },
  {
    src: '/covers/cover6.png',
    title: { ar: 'اللؤلؤة المضيئة', en: 'The Glowing Pearl' },
    subtitle: { ar: 'أسرار الأعماق وسحر المحيط الهادئ', en: 'Deep Ocean Wonders & Sea Turtle Secrets' },
    category: { ar: 'عالم البحار', en: 'Ocean Magic' },
    accent: '#E69B00'
  },
  {
    src: '/covers/cover7.png',
    title: { ar: 'أسرار الشعب المرجانية', en: 'The Secret Reef' },
    subtitle: { ar: 'مغامرة الدلافين والأعماق الملونة', en: 'Dolphins & Colorful Coral Kingdom' },
    category: { ar: 'عالم البحار', en: 'Ocean Expedition' },
    accent: '#0F547C'
  },
  {
    src: '/covers/cover8.png',
    title: { ar: 'الرحلة إلى السوق القديم', en: 'Ancient Souq Adventure' },
    subtitle: { ar: 'اكتشاف كنوز التراث والمدينة الساحرة', en: 'Discovering Heritage Treasures in the Old Market' },
    category: { ar: 'سحر وتراث', en: 'Heritage & Magic' },
    accent: '#1C4B75'
  }
];

interface TranslationStrings {
  titlePrefix: string;
  heroWord: string;
  titleSuffix: string;
  tagline: string;
  editorialTitle: string;
  editorialSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  card1Title: string;
  card1Tag: string;
  card1Desc: string;
  card1Link: string;
  card2Title: string;
  card2Tag: string;
  card2Desc: string;
  card2Link: string;
  card3Title: string;
  card3Tag: string;
  card3Desc: string;
  card3Link: string;
  carouselEyebrow: string;
  carouselTitle: string;
  carouselSubtitle: string;
  cardCustomTag: string;
  chooseTheme: string;
  finaleBadge: string;
  finaleTitle: string;
  finaleDesc: string;
  finaleCta: string;
  privacyPolicy: string;
  termsOfService: string;
}

const TRANSLATIONS: Record<Language, TranslationStrings> = {
  ar: {
    titlePrefix: 'اجعل طفلك',
    heroWord: 'بطل',
    titleSuffix: 'قصته الخاصة',
    tagline: 'قصة مصورة ومطبوعة فاخرة باسم وملامح طفلك الحقيقية ليخوض أروع المغامرات التي لا تُنسى.',
    editorialTitle: 'كتاب ساحر يُكتب ويُطبع خصيصاً لطفلك',
    editorialSubtitle: 'اسم وملامح طفلك الحقيقية في كتاب مطبوع فاخر من بطولته الخاصة.',
    ctaPrimary: 'اصنع كتاب طفلك الآن',
    ctaSecondary: 'تصفح نماذج القصص',
    card1Title: 'تخصيص كامل في دقيقة',
    card1Tag: 'سريع وفوري',
    card1Desc: 'أدخل اسم طفلك وعمره وصورته، وسيقوم الذكاء الاصطناعي برسم وتأليف كتابه الخاص في ثوانٍ معدودة.',
    card1Link: 'تخصيص سريع وفوري',
    card2Title: 'غلاف مقوى وجودة فاخرة',
    card2Tag: 'مواصفات 20×20 سم',
    card2Desc: 'طباعة بألوان زاهية على ورق حريري سميك مقاوم للبصمات مع تجليد خياطة صلب يدوم طويلاً.',
    card2Link: 'جودة متاحف وتجليد متين',
    card3Title: 'شحن سريع وتغليف هدايا',
    card3Tag: 'توصيل لجميع الدول',
    card3Desc: 'يصلك الكتاب بتغليف هدايا أنيق مع كرت إهداء شخصي، وتتبع مباشر حتى باب منزلك.',
    card3Link: 'تغليف هدايا وتتبع فوري',
    carouselEyebrow: 'مكتبة راوي الساحرة 📚',
    carouselTitle: 'تصفح عوالم راوي المبتكرة',
    carouselSubtitle: 'كل قصة هي رحلة فريدة صممت لتلهم طفلك وتنمي شجاعته وفضوله للقراءة',
    cardCustomTag: 'قصة مخصصة',
    chooseTheme: 'ابدأ بهذه القصة',
    finaleBadge: '+50 قصة ومغامرة إضافية',
    finaleTitle: 'وهناك أكثر من 50 عالماً آخر بانتظاركم!',
    finaleDesc: 'من رحلات الديناصورات وأعماق البحار إلى حكايات ما قبل النوم وأبطال القيم. اختر قالباً أو دعنا نبتكر قصة فريدة بالكامل لطفلك.',
    finaleCta: '✨ ابدأ تصميم كتاب طفلك الآن',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة'
  },
  en: {
    titlePrefix: 'Turn Your Child Into the',
    heroWord: 'Hero',
    titleSuffix: 'of Their Own Story',
    tagline: 'Personalized premium hardcover storybooks starring your child’s name, likeness, and boundless imagination.',
    editorialTitle: 'A One-of-a-Kind Storybook Made For Your Child',
    editorialSubtitle: 'Your child’s real name and photo in a custom printed hardcover book made just for them.',
    ctaPrimary: 'Create Your Child\'s Book Now',
    ctaSecondary: 'Explore Sample Stories',
    card1Title: '1-Minute Customization',
    card1Tag: 'Instant Magic AI',
    card1Desc: 'Provide your child’s name, age, and photo. Our specialized AI illustrates and writes their custom tale in seconds.',
    card1Link: 'Instant 60-Second Customization',
    card2Title: 'Premium Hardcover Quality',
    card2Tag: '20×20cm Square Format',
    card2Desc: 'Printed on fingerprint-resistant satin paper with durable stitch-binding built for little hands.',
    card2Link: 'Durable Bookstore-Grade Binding',
    card3Title: 'Express Worldwide Delivery',
    card3Tag: 'Gift Packaging Included',
    card3Desc: 'Delivered in presentation gift packaging with a personalized dedication note and tracked delivery.',
    card3Link: 'Gift Packaging & Tracked Delivery',
    carouselEyebrow: 'The Rawy Story Library 📚',
    carouselTitle: 'Explore Magical Story Worlds',
    carouselSubtitle: 'Every story is a wondrous world crafted to inspire curiosity, courage, and dreams',
    cardCustomTag: 'Personalized Book',
    chooseTheme: 'Start This Story',
    finaleBadge: '50+ More Themes Awaiting',
    finaleTitle: 'Plus 50+ More Story Worlds Awaiting!',
    finaleDesc: 'From dinosaur expeditions and coral reef wonders to bedtime fairy tales and moral triumphs. Choose a world or let us craft a 100% custom adventure.',
    finaleCta: '✨ Create Your Child\'s Book Now',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service'
  },
  de: {
    titlePrefix: 'Mach dein Kind zum',
    heroWord: 'Helden',
    titleSuffix: 'seiner eigenen Geschichte',
    tagline: 'Personalisierte Hardcover-Bücher mit Namen und Illustration deines Kindes.',
    editorialTitle: 'Ein einzigartiges Buch für dein Kind',
    editorialSubtitle: 'Name und Foto deines Kindes in einem hochwertigen, gedruckten Hardcover-Buch.',
    ctaPrimary: 'Jetzt Kinderbuch gestalten',
    ctaSecondary: 'Geschichten ansehen',
    card1Title: 'In 1 Minute gestaltet',
    card1Tag: 'Sofortige KI-Magie',
    card1Desc: 'Name und Foto eingeben – unsere KI erstellt im Handumdrehen eine zauberhafte Geschichte.',
    card1Link: 'Blitzschnelle Gestaltung',
    card2Title: 'Edles Hardcover 20×20cm',
    card2Tag: 'Premium-Druck',
    card2Desc: 'Langlebige Fadenheftung und seidenglänzendes Papier für Generationen.',
    card2Link: 'Langlebige Buchqualität',
    card3Title: 'Weltweiter Schnellversand',
    card3Tag: 'Geschenkbox inklusive',
    card3Desc: 'Liebevoll verpackt mit persönlicher Widmung direkt zu dir nach Hause.',
    card3Link: 'Liebevoll verpackt mit Sendungsverfolgung',
    carouselEyebrow: 'Rawy Geschichten-Bibliothek 📚',
    carouselTitle: 'Entdecke zauberhafte Welten',
    carouselSubtitle: 'Jedes Buch inspiriert die Fantasie und Leselust deines Kindes',
    cardCustomTag: 'Personalisiertes Buch',
    chooseTheme: 'Dieses Buch wählen',
    finaleBadge: 'Über 50 weitere Geschichten',
    finaleTitle: 'Und noch 50+ weitere Abenteuer!',
    finaleDesc: 'Von Dinosauriern bis zu Gutenachtgeschichten – wähle ein Thema oder gestalte eine freie Geschichte.',
    finaleCta: '✨ Jetzt Buch gestalten',
    privacyPolicy: 'Datenschutz',
    termsOfService: 'AGB'
  },
  tr: {
    titlePrefix: 'Çocuğunuzu Kendi Hikayesinin',
    heroWord: 'Kahramanı',
    titleSuffix: 'Yapın',
    tagline: 'Çocuğunuzun adı ve yüzüyle hazırlanan lüks kişiye özel masal kitabı.',
    editorialTitle: 'Çocuğunuza Özel Masal Kitabı',
    editorialSubtitle: 'Çocuğunuzun gerçek ismi ve fotoğrafıyla basılan lüks sert kapak masal kitabı.',
    ctaPrimary: 'Kitabı Şimdi Oluşturun',
    ctaSecondary: 'Hikayeleri Gör',
    card1Title: '1 Dakikada Tasarım',
    card1Tag: 'Yapay Zeka Büyüsü',
    card1Desc: 'İsim ve fotoğrafı yükleyin, özel yapay zekamız hikayeyi saniyeler içinde hazırlasın.',
    card1Link: '1 Dakikada Hızlı Tasarım',
    card2Title: 'Lüks Sert Kapak',
    card2Tag: '20×20 cm Özel Baskı',
    card2Desc: 'Kalın ipeksi sayfalar ve küçük ellere dayanıklı özel dikişli ciltleme.',
    card2Link: 'Dayanıklı Özel Cilt',
    card3Title: 'Tüm Dünyaya Hızlı Kargo',
    card3Tag: 'Hediye Paketli',
    card3Desc: 'Özel hediye kutusunda ve takip numarasıyla kapınıza kadar güvenle teslim edilir.',
    card3Link: 'Hediye Paketi ve Takip',
    carouselEyebrow: 'Rawy Masal Kitaplığı 📚',
    carouselTitle: 'Büyülü Dünyaları Keşfedin',
    carouselSubtitle: 'Her hikaye çocuğunuzun hayal gücünü ve cesaretini beslemek için tasarlandı',
    cardCustomTag: 'Kişiye Özel Kitap',
    chooseTheme: 'Bu Hikayeyle Başla',
    finaleBadge: '50+ Farklı Masal Teması',
    finaleTitle: '50\'den Fazla Büyülü Macera Sizi Bekliyor!',
    finaleDesc: 'Dinozorlardan uzay keşfine, uyku masallarından değerler eğitimine kadar zengin kütüphane.',
    finaleCta: '✨ Kitabınızı Şimdi Oluşturun',
    privacyPolicy: 'Gizlilik Politikası',
    termsOfService: 'Kullanım Şartları'
  },
  zh: {
    titlePrefix: '让您的孩子成为自己故事的',
    heroWord: '主角',
    titleSuffix: '',
    tagline: '印有孩子姓名与插画形象的专属精装定制绘本。',
    editorialTitle: '为孩子量身定制的专属童话绘本',
    editorialSubtitle: '孩子的真实姓名与专属形象，跃然于精美的高端硬壳定制绘本之中。',
    ctaPrimary: '立即定制儿童绘本',
    ctaSecondary: '查看示例',
    card1Title: '1分钟极速定制',
    card1Tag: 'AI 即刻生成',
    card1Desc: '只需输入孩子姓名与照片，AI即刻编织并绘制独一无二的专属童话故事。',
    card1Link: '1分钟即刻生成预览',
    card2Title: '高端精装硬壳',
    card2Tag: '20×20cm 正方典藏',
    card2Desc: '加厚丝光纸张与耐磨锁线装订，专为孩子小手设计，代代珍藏。',
    card2Link: '专业出版级装订品质',
    card3Title: '全球快速配送',
    card3Tag: '精美礼品包装',
    card3Desc: '尊贵礼盒包装配专属寄语卡，全球快递安全直达家门。',
    card3Link: '礼品礼盒与全程追踪',
    carouselEyebrow: 'Rawy 魔法书库 📚',
    carouselTitle: '探索奇妙故事世界',
    carouselSubtitle: '每个故事都精心雕琢，激发无限想象力与阅读兴趣',
    cardCustomTag: '专属定制',
    chooseTheme: '选择此故事',
    finaleBadge: '超 50+ 丰富故事主题',
    finaleTitle: '还有 50 多个奇幻主题等你发现！',
    finaleDesc: '从恐龙探险、浩瀚宇宙到睡前温情故事，任选主题或定制完全独创的故事。',
    finaleCta: '✨ 立即为孩子定制绘本',
    privacyPolicy: '隐私政策',
    termsOfService: '服务条款'
  },
  ja: {
    titlePrefix: 'お子さまが',
    heroWord: '主人公',
    titleSuffix: 'になる世界でたったひとつの絵本',
    tagline: 'お子さまのお名前とお顔がそのまま登場する特別なハードカバー絵本。',
    editorialTitle: 'お子さまのためだけに仕立てる特別な絵本',
    editorialSubtitle: 'お子さまのお名前とお顔がそのまま主人公になる、印刷仕立ての豪華なハードカバー絵本。',
    ctaPrimary: '今すぐ絵本をつくる',
    ctaSecondary: '見本を見る',
    card1Title: '1分でかんたん作成',
    card1Tag: 'AI が瞬時に物語を紡ぐ',
    card1Desc: 'お子さまのお名前と写真を登録するだけ。数秒でオリジナル絵本が完成します。',
    card1Link: 'かんたん作成プレビュー',
    card2Title: '高級ハードカバー',
    card2Tag: '20×20cm 上質製本',
    card2Desc: '耐久性に優れた糸綴じ製本と指紋がつきにくい上質紙を採用。',
    card2Link: '丈夫で長持ちする上質製本',
    card3Title: '世界中へスピード配送',
    card3Tag: 'ギフト包装でお届け',
    card3Desc: 'メッセージカード付きの特製ギフト包装で、世界中のご自宅へ安全にお届け。',
    card3Link: 'ギフト包装・追跡付き配送',
    carouselEyebrow: 'Rawy の絵本ライブラリ 📚',
    carouselTitle: '魔法のような世界を冒険しよう',
    carouselSubtitle: 'お子さまの好奇心と夢を大きく広げる多彩なストーリー',
    cardCustomTag: '名入れ絵本',
    chooseTheme: 'この絵本を選ぶ',
    finaleBadge: '50以上のテーマをご用意',
    finaleTitle: 'さらに50種類以上の冒険が待っています！',
    finaleDesc: '恐竜の世界、星空の旅、おやすみ前の優しいお話まで。お子さまにぴったりの1冊をお作りいただけます。',
    finaleCta: '✨ 今すぐ絵本をつくる',
    privacyPolicy: 'プライバシーポリシー',
    termsOfService: '利用規約'
  },
  fr: {
    titlePrefix: 'Faites de votre enfant le',
    heroWord: 'héros',
    titleSuffix: 'de sa propre histoire',
    tagline: 'Des livres reliés personnalisés avec le prénom et le visage de votre enfant.',
    editorialTitle: 'Un livre unique conçu pour votre enfant',
    editorialSubtitle: 'Le prénom et le visage de votre enfant dans un magnifique livre relié imprimé pour lui.',
    ctaPrimary: 'Créer le livre de votre enfant',
    ctaSecondary: 'Découvrir',
    card1Title: 'Personnalisation en 1 min',
    card1Tag: 'Magie de l\'IA instantanée',
    card1Desc: 'Entrez le prénom et la photo de votre enfant, l\'IA compose son aventure sur-mesure en quelques secondes.',
    card1Link: 'Création instantanée',
    card2Title: 'Couverture rigide premium',
    card2Tag: 'Format d\'art 20×20 cm',
    card2Desc: 'Papier satiné épais et reliure cousue haute durabilité pour traverser les générations.',
    card2Link: 'Reliure haute durabilité',
    card3Title: 'Livraison rapide mondiale',
    card3Tag: 'Écrin cadeau inclus',
    card3Desc: 'Emballage cadeau soigné avec carte de dédicace et suivi express jusqu\'à votre porte.',
    card3Link: 'Écrin cadeau & suivi express',
    carouselEyebrow: 'Bibliothèque Magique Rawy 📚',
    carouselTitle: 'Explorez des univers enchantés',
    carouselSubtitle: 'Chaque histoire est une aventure créée pour éveiller le courage et la curiosité',
    cardCustomTag: 'Livre personnalisé',
    chooseTheme: 'Choisir cette histoire',
    finaleBadge: '+50 autres aventures',
    finaleTitle: 'Et plus de 50 autres univers magiques vous attendent !',
    finaleDesc: 'Des dinosaures aux fonds marins, en passant par les contes du coucher. Choisissez un monde ou créez une histoire 100% unique.',
    finaleCta: '✨ Créer le livre maintenant',
    privacyPolicy: 'Politique de confidentialité',
    termsOfService: 'Conditions'
  },
  es: {
    titlePrefix: 'Haz que tu hijo sea el',
    heroWord: 'héroe',
    titleSuffix: 'de su propia historia',
    tagline: 'Libros infantiles personalizados de tapa dura con el nombre y rostro de tu hijo.',
    editorialTitle: 'Un cuento único creado para tu hijo',
    editorialSubtitle: 'El nombre y rostro de tu hijo en un libro impreso de tapa dura hecho especialmente para él.',
    ctaPrimary: 'Crea el libro de tu hijo ahora',
    ctaSecondary: 'Ver historias',
    card1Title: 'Personalización en 1 minuto',
    card1Tag: 'Magia IA al instante',
    card1Desc: 'Introduce su nombre y foto, y nuestra IA crea e ilustra su cuento en segundos.',
    card1Link: 'Personalización en 60 segundos',
    card2Title: 'Tapa dura de calidad premium',
    card2Tag: 'Formato 20×20 cm',
    card2Desc: 'Páginas satinadas de alto gramaje con encuadernación cosida resistente.',
    card2Link: 'Encuadernación de alta durabilidad',
    card3Title: 'Envío rápido mundial',
    card3Tag: 'Empaque de regalo',
    card3Desc: 'Llega en elegante empaque de regalo con tarjeta de dedicatoria y seguimiento directo.',
    card3Link: 'Empaque de regalo y entrega rastreada',
    carouselEyebrow: 'Biblioteca Mágica Rawy 📚',
    carouselTitle: 'Explora mundos extraordinarios',
    carouselSubtitle: 'Cada libro está diseñado para despertar la imaginación y el amor por la lectura',
    cardCustomTag: 'Libro personalizado',
    chooseTheme: 'Elegir esta historia',
    finaleBadge: 'Más de 50 temas disponibles',
    finaleTitle: '¡Más de 50 mundos mágicos te esperan!',
    finaleDesc: 'Dinosaurios, viajes espaciales, cuentos para dormir y aventuras de valores.',
    finaleCta: '✨ Diseña el libro ahora',
    privacyPolicy: 'Política de privacidad',
    termsOfService: 'Términos'
  },
  it: {
    titlePrefix: 'Rendi tuo figlio il',
    heroWord: 'protagonista',
    titleSuffix: 'della sua storia',
    tagline: 'Libri con copertina rigida personalizzati con nome e viso di tuo figlio.',
    editorialTitle: 'Un libro speciale creato per il tuo bambino',
    editorialSubtitle: 'Il nome e il volto del tuo bambino in un libro stampato con copertina rigida dedicato a lui.',
    ctaPrimary: 'Crea subito il libro',
    ctaSecondary: 'Guarda storie',
    card1Title: 'Personalizzazione in 1 min',
    card1Tag: 'Magia istantanea',
    card1Desc: 'Inserisci nome e foto, e la nostra IA crea una storia esclusiva in pochi istanti.',
    card1Link: 'Personalizzazione in 60 secondi',
    card2Title: 'Copertina rigida premium 20×20',
    card2Tag: 'Qualità da libreria',
    card2Desc: 'Carta satinata spessa e rilegatura cucita resistente fatta per le manine dei piccoli.',
    card2Link: 'Rilegatura solida e duratura',
    card3Title: 'Spedizione rapida nel mondo',
    card3Tag: 'Confezione regalo',
    card3Desc: 'Arriva in una confezione regalo con dedica personalizzata e corriere espresso tracciato.',
    card3Link: 'Confezione regalo e spedizione tracciata',
    carouselEyebrow: 'Biblioteca delle Fiabe Rawy 📚',
    carouselTitle: 'Esplora mondi incantati',
    carouselSubtitle: 'Ogni libro è un viaggio magico che accende fantasia e curiosità',
    cardCustomTag: 'Libro personalizzato',
    chooseTheme: 'Inizia con questa storia',
    finaleBadge: 'Oltre 50 storie disponibili',
    finaleTitle: 'Più di 50 avventure ti aspettano!',
    finaleDesc: 'Dinosauri, spazio, mari profondi e favole della buonanotte.',
    finaleCta: '✨ Crea subito il libro',
    privacyPolicy: 'Privacy',
    termsOfService: 'Termini'
  },
  pt: {
    titlePrefix: 'Torne seu filho o',
    heroWord: 'herói',
    titleSuffix: 'da sua própria história',
    tagline: 'Livros de capa dura personalizados com o nome e rosto do seu filho.',
    editorialTitle: 'Um livro único feito para o seu filho',
    editorialSubtitle: 'O nome e o rosto do seu filho em um livro de capa dura impresso especialmente para ele.',
    ctaPrimary: 'Crie o livro do seu filho agora',
    ctaSecondary: 'Ver histórias',
    card1Title: 'Personalização em 1 minuto',
    card1Tag: 'Magia com IA',
    card1Desc: 'Basta informar o nome e foto da criança para criar um conto exclusivo em segundos.',
    card1Link: 'Personalização em 60 segundos',
    card2Title: 'Capa dura premium 20×20cm',
    card2Tag: 'Papel acetinado',
    card2Desc: 'Costura reforçada e papel resistente a marcas, feito para durar gerações.',
    card2Link: 'Acabamento duradouro de alta qualidade',
    card3Title: 'Envío rápido para o mundo todo',
    card3Tag: 'Embalagem de presente',
    card3Desc: 'Entregue com pacote de presente e dedicatória especial na sua porta.',
    card3Link: 'Embalagem de presente e rastreamento',
    carouselEyebrow: 'Biblioteca Mágica Rawy 📚',
    carouselTitle: 'Explore mundos encantados',
    carouselSubtitle: 'Cada história é projetada para inspirar imaginação e gosto pela leitura',
    cardCustomTag: 'Livro personalizado',
    chooseTheme: 'Escolher esta história',
    finaleBadge: '+50 histórias disponíveis',
    finaleTitle: 'Mais de 50 temas mágicos esperam por você!',
    finaleDesc: 'Dinossauros, cosmos, reinos submarinos e contos de ninar.',
    finaleCta: '✨ Começar agora',
    privacyPolicy: 'Privacidade',
    termsOfService: 'Termos'
  },
  ru: {
    titlePrefix: 'Сделайте вашего ребенка',
    heroWord: 'героем',
    titleSuffix: 'его собственной сказки',
    tagline: 'Персонализированные книги в твердом переплете с именем и портретом ребенка.',
    editorialTitle: 'Уникальная книга в твердом переплете для вашего ребенка',
    editorialSubtitle: 'Имя и фото вашего ребенка в настоящей книге в твердом переплете, созданной специально для него.',
    ctaPrimary: 'Создать книгу для ребенка',
    ctaSecondary: 'Примеры',
    card1Title: 'Создание за 1 минуту',
    card1Tag: 'Мгновенный ИИ',
    card1Desc: 'Укажите имя и загрузите фото — наш ИИ сочинит и проиллюстрирует сказку за секунды.',
    card1Link: 'Быстрое создание за 60 секунд',
    card2Title: 'Твердый переплет премиум 20×20 см',
    card2Tag: 'Музейное качество',
    card2Desc: 'Плотная шелковистая бумага и надежный прошитый переплет для детских ручек.',
    card2Link: 'Прочный качественный переплет',
    card3Title: 'Быстрая доставка по миру',
    card3Tag: 'Подарочная упаковка',
    card3Desc: 'Красивая подарочная коробка с именной открыткой и курьерской доставкой до двери.',
    card3Link: 'Подарочная коробка и отслеживание',
    carouselEyebrow: 'Волшебная библиотека Rawy 📚',
    carouselTitle: 'Исследуйте волшебные миры',
    carouselSubtitle: 'Каждая книга вдохновляет на мечты, храбрость и любовь к чтению',
    cardCustomTag: 'Именная книга',
    chooseTheme: 'Выбрать эту сказку',
    finaleBadge: 'Более 50 тем сказок',
    finaleTitle: 'И еще более 50 других миров ждут вас!',
    finaleDesc: 'От динозавров и космоса до подводных тайн и вечерних сказок.',
    finaleCta: '✨ Создать книгу прямо сейчас',
    privacyPolicy: 'Конфиденциальность',
    termsOfService: 'Условия'
  }
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onStart, 
  language 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeVideoSrc = isMobile ? '/hero-apple-1.mp4' : '/hero-apple-2.mp4';

  const lang = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isAr = language === 'ar';

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 340;
    const sign = direction === 'left' ? -1 : 1;
    carouselRef.current.scrollBy({ left: sign * scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="font-sans overflow-x-hidden flex flex-col relative w-full bg-[#FAF9F6] text-[#001A40]">
      
      {/* ========================================================================= */}
      {/* 1. 100% FULL-BLEED VIDEO HERO BANNER (NO FLOATING REPLAY / OMAR PILL)     */}
      {/* ========================================================================= */}
      <section className="relative w-full h-[86vh] sm:h-[84vh] lg:h-[88vh] min-h-[580px] max-h-[960px] overflow-hidden bg-black select-none flex flex-col justify-between">
        
        {/* Full-Bleed Edge-to-Edge Video */}
        <video
          key={activeVideoSrc}
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg"
        >
          <source src={activeVideoSrc} type="video/mp4" />
        </video>

        {/* Ambient Overlay Gradients */}
        {/* Desktop: Soft left-side vignette that protects the action column and keeps the faces & book on the right fully visible */}
        <div className="hidden lg:block absolute inset-y-0 left-0 w-[52%] rtl:left-auto rtl:right-0 bg-gradient-to-r rtl:bg-gradient-to-l from-black/85 via-black/45 to-transparent pointer-events-none z-10"></div>
        
        {/* Mobile: Top vignette for title + Bottom vignette for CTA buttons. Leaves the entire middle 30%+ completely clear and bright! */}
        <div className="lg:hidden absolute inset-x-0 top-0 h-[36%] bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none z-10"></div>
        <div className="lg:hidden absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10"></div>

        {/* ----------------------------------------------------------------------- */}
        {/* ACTION OVERLAY: Left-aligned on Desktop, Top/Bottom anchored on Mobile  */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-14 flex-1 flex flex-col justify-between lg:justify-center py-6 sm:py-8 lg:py-0">
          
          {/* Main Title Group (Top on mobile, left on desktop) */}
          <div className="w-full sm:max-w-md lg:max-w-[480px] xl:max-w-[520px] text-center lg:text-left rtl:lg:text-right animate-fade-in pt-3 sm:pt-4 lg:pt-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[48px] font-black text-white tracking-tight leading-[1.14] drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
              {lang.titlePrefix}{' '}
              <span className="relative inline-block text-[#F78F50]">
                {lang.heroWord}
                <svg className="absolute -bottom-1.5 left-0 w-full h-2.5 text-[#F78F50]/70" preserveAspectRatio="none" viewBox="0 0 100 10">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4"></path>
                </svg>
              </span>{' '}
              {lang.titleSuffix}
            </h1>
          </div>

          {/* Buttons: Anchored cleanly at base (Mobile) or under title (Desktop) */}
          <div className="w-full sm:max-w-md lg:max-w-[480px] xl:max-w-[520px] space-y-2.5 sm:space-y-3 lg:mt-8 pb-5 sm:pb-6 lg:pb-0 mx-auto lg:mx-0">
            {/* Primary Signature Orange Pill Button (#F78F50) */}
            <button 
              onClick={onStart}
              className="w-full text-base sm:text-lg font-black py-3.5 sm:py-4 px-7 rounded-full shadow-[0_12px_28px_rgba(247,143,80,0.5)] hover:shadow-[0_16px_36px_rgba(247,143,80,0.7)] hover:bg-[#e07b3d] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 relative overflow-hidden group bg-[#F78F50] text-white cursor-pointer"
              id="btn_welcome_hero_start"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
              <span>{lang.ctaPrimary}</span>
              <span className="material-symbols-outlined font-black text-xl group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                {isAr ? 'arrow_back' : 'arrow_forward'}
              </span>
            </button>

            {/* Secondary Clean Pill Button with Teal text (#006B5D) */}
            <button 
              onClick={() => {
                const sampleSection = document.getElementById('sample-carousel');
                sampleSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-6 rounded-full bg-white/95 hover:bg-white text-[#006B5D] border-2 border-[#006B5D]/20 hover:border-[#006B5D]/40 shadow-lg backdrop-blur-md transition-all duration-200 ease-out flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{lang.ctaSecondary}</span>
              <span className="material-symbols-outlined text-base">arrow_downward</span>
            </button>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. RE-ENGINEERED FEATURE BANNER STRIP (NO "SIGNATURE" BADGE, NO "HEIRLOOM") */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#FAF7F2] border-b border-amber-200/50 py-10 sm:py-14 px-4 sm:px-6 relative z-20">
        <div className="max-w-6xl mx-auto rounded-3xl bg-white/90 p-6 sm:p-10 border border-amber-200/60 shadow-sm backdrop-blur-md">
          
          {/* Banner Section Header: Shortened & Clean */}
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#001A40] tracking-tight leading-snug">
              {lang.editorialTitle}
            </h2>

            <p className="text-sm sm:text-base md:text-lg font-medium text-[#554339]/85 leading-relaxed">
              {lang.editorialSubtitle}
            </p>
          </div>

          {/* 3 Cohesive Banner Feature Pillars (NO CHEVRON_RIGHT) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            
            {/* Pillar 1: 1-Minute Customization (#F78F50 Orange) */}
            <div className="rounded-2xl p-6 bg-[#FFFDF9] border border-[#F78F50]/20 shadow-sm flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#F78F50]/15 flex items-center justify-center text-[#F78F50] text-xl font-black shadow-sm">
                    ⚡
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#F78F50]/10 text-[#F78F50] border border-[#F78F50]/20">
                    {lang.card1Tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-[#001A40]">
                    {lang.card1Title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#554339]/80 font-medium leading-relaxed">
                    {lang.card1Desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F78F50]/10 text-xs font-black text-[#F78F50]">
                <span>{lang.card1Link}</span>
              </div>
            </div>

            {/* Pillar 2: Premium Hardcover (#006B5D Deep Teal) */}
            <div className="rounded-2xl p-6 bg-[#F7FCFA] border border-[#006B5D]/20 shadow-sm flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#006B5D]/15 flex items-center justify-center text-[#006B5D] text-xl font-black shadow-sm">
                    📖
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#006B5D]/10 text-[#006B5D] border border-[#006B5D]/20">
                    {lang.card2Tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-[#001A40]">
                    {lang.card2Title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#554339]/80 font-medium leading-relaxed">
                    {lang.card2Desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#006B5D]/10 text-xs font-black text-[#006B5D]">
                <span>{lang.card2Link}</span>
              </div>
            </div>

            {/* Pillar 3: Worldwide Delivery (#ECC156 Soft Gold) */}
            <div className="rounded-2xl p-6 bg-[#FFFDF5] border border-[#ECC156]/35 shadow-sm flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#ECC156]/25 flex items-center justify-center text-[#B88710] text-xl font-black shadow-sm">
                    🚚
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ECC156]/20 text-[#9C7006] border border-[#ECC156]/30">
                    {lang.card3Tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-[#001A40]">
                    {lang.card3Title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#554339]/80 font-medium leading-relaxed">
                    {lang.card3Desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#ECC156]/20 text-xs font-black text-[#9C7006]">
                <span>{lang.card3Link}</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EXPANDED, SCROLLABLE THEMES CAROUSEL WITH PERFECT TEXT ALIGNMENT       */}
      {/* ========================================================================= */}
      <section id="sample-carousel" className="py-14 sm:py-20 bg-[#FAF9F6] border-t border-slate-200/60 relative z-10 text-[#001A40] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header with Carousel Navigation Arrows */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#006B5D] bg-[#006B5D]/10 px-3 py-1 rounded-full border border-[#006B5D]/20">
                <span>{lang.carouselEyebrow}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#001A40] tracking-tight">
                {lang.carouselTitle}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium max-w-2xl">
                {lang.carouselSubtitle}
              </p>
            </div>

            {/* Desktop Carousel Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scrollCarousel(isAr ? 'right' : 'left')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#F78F50] text-[#001A40] hover:text-white border border-slate-200 shadow-md flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="Previous Theme"
              >
                <span className="material-symbols-outlined text-xl">
                  {isAr ? 'chevron_right' : 'chevron_left'}
                </span>
              </button>

              <button
                onClick={() => scrollCarousel(isAr ? 'left' : 'right')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#F78F50] text-[#001A40] hover:text-white border border-slate-200 shadow-md flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="Next Theme"
              >
                <span className="material-symbols-outlined text-xl">
                  {isAr ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable Big Books Carousel */}
          <div 
            ref={carouselRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto pb-8 pt-2 px-1 scroll-smooth snap-x snap-mandatory focus:outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {COVER_METADATA.map((cover, index) => (
              <div 
                key={index}
                onClick={onStart}
                className="group cursor-pointer shrink-0 w-[270px] sm:w-[310px] md:w-[330px] snap-start rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white border border-slate-200/80 flex flex-col justify-between relative"
              >
                {/* Book Spine Crease Effect */}
                <div className={`absolute top-0 bottom-0 ${isAr ? 'right-0 border-r-[8px]' : 'left-0 border-l-[8px]'} border-black/20 z-20 pointer-events-none w-3 bg-gradient-to-r ${isAr ? 'from-transparent to-black/25' : 'from-black/25 to-transparent'}`}></div>

                {/* Big Book Cover Image */}
                <div className="aspect-[4/5] w-full relative overflow-hidden bg-slate-100">
                  <img 
                    src={cover.src} 
                    alt={isAr ? cover.title.ar : cover.title.en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                  />
                  
                  {/* Category Pill on Top */}
                  <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/20 shadow-sm">
                      {isAr ? cover.category.ar : cover.category.en}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F78F50] text-[9px] font-black uppercase text-white shadow-sm">
                      {lang.cardCustomTag}
                    </span>
                  </div>
                </div>

                {/* Structured Text & Footer Container: Perfectly Aligned */}
                <div className="p-4 sm:p-5 bg-white flex flex-col justify-between flex-1 gap-3 border-t border-slate-100">
                  <div className="text-start">
                    <p className="text-xs sm:text-sm text-[#001A40] font-bold leading-relaxed line-clamp-2 group-hover:text-[#F78F50] transition-colors">
                      {isAr ? cover.subtitle.ar : cover.subtitle.en}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#001A40] group-hover:text-[#F78F50] transition-colors">
                    <span>{lang.chooseTheme}</span>
                    <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#F78F50] group-hover:text-white flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-base">
                        {isAr ? 'arrow_back' : 'arrow_forward'}
                      </span>
                    </span>
                  </div>
                </div>

              </div>
            ))}

            {/* ================================================================= */}
            {/* FINALE CARD: "50+ MORE STORIES AWAITING"                          */}
            {/* ================================================================= */}
            <div 
              onClick={onStart}
              className="group cursor-pointer shrink-0 w-[280px] sm:w-[320px] md:w-[340px] snap-start rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-[#001A40] via-[#002D62] to-[#006B5D] border-2 border-amber-300/40 flex flex-col justify-between relative text-white p-6 sm:p-8 select-none"
            >
              {/* Background ambient decorative sparkles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#F78F50]/25 blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#ECC156]/20 blur-2xl pointer-events-none"></div>

              {/* Top Section */}
              <div className="space-y-4 relative z-10 text-start">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-black border border-amber-400/30">
                  <span>✨ {lang.finaleBadge}</span>
                </div>

                {/* Big Impressive 50+ Graphic */}
                <div className="pt-2">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 drop-shadow-sm">
                    +50
                  </span>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#ECC156] mt-0.5">
                    {isAr ? 'عالم وقصة ملهمة' : 'Magical Adventures'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                    {lang.finaleTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
                    {lang.finaleDesc}
                  </p>
                </div>
              </div>

              {/* Bottom CTA Button on the Finale Card */}
              <div className="pt-6 relative z-10">
                <button 
                  onClick={onStart}
                  className="w-full text-xs sm:text-sm font-black py-3.5 px-5 rounded-full bg-[#F78F50] hover:bg-[#e07b3d] text-white shadow-lg hover:shadow-[0_8px_20px_rgba(247,143,80,0.6)] transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02] cursor-pointer"
                >
                  <span>{lang.finaleCta}</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    {isAr ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </button>
              </div>

            </div>

          </div>

          {/* Mobile Swipe Hint */}
          <div className="flex sm:hidden items-center justify-center gap-2 text-xs font-semibold text-slate-400 mt-2">
            <span className="material-symbols-outlined text-sm animate-pulse">swipe</span>
            <span>{isAr ? 'اسحب لتصفح باقي القصص (+50 قصة)' : 'Swipe to explore all themes (50+)'}</span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OFFICIAL LOGO LOADING ANIMATION SHOWCASE BANNER                        */}
      {/* "can you also show me the animation of how color fill the logo"           */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-t border-slate-200 relative z-10 text-[#001A40]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#F78F50]/10 text-[#F78F50] border border-[#F78F50]/20">
              {isAr ? 'نظام التحميل المبتكر' : 'Official Rawy Loading System'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#001A40]">
              {isAr ? 'حركة ملء شعار راوي بالألوان أثناء التحميل' : 'How Colors Fill the Rawy Logo During Loading'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
              {isAr 
                ? 'يبدأ الشعار كخطوط هيكلية مجردة بدون لون، ثم تتدفق ألوان راوي الأصلية تدريجياً لملء الكتاب والنجم' 
                : 'The logo starts as a plain line-art skeleton, then authentic vibrant brand colors rise to fill the book and star'}
            </p>
          </div>

          {/* Live Animation Demonstration Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center justify-center py-6 px-4 bg-[#FAF9F6] rounded-3xl border border-slate-200/80 shadow-inner">
            
            {/* Step 1: Plain Skeleton */}
            <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? '1. الشعار الخطي المجرد' : '1. Plain Skeleton'}
              </span>
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/logo-skeleton.png" alt="Skeleton" className="w-14 h-14 object-contain opacity-50" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {isAr ? 'هيكل الكتاب والنجم' : 'Uncolored outline'}
              </span>
            </div>

            {/* Step 2: Live Liquid Fill Animation */}
            <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border-2 border-[#F78F50]/30 shadow-md ring-2 ring-[#F78F50]/10">
              <span className="text-[11px] font-black text-[#F78F50] uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F78F50] animate-ping"></span>
                <span>{isAr ? '2. الملء التدريجي بالألوان' : '2. Liquid Color Fill'}</span>
              </span>
              <Spinner size="md" />
              <span className="text-[10px] font-bold text-[#001A40]/80">
                {isAr ? 'حركة التحميل الحية' : 'Live Looping Animation'}
              </span>
            </div>

            {/* Step 3: Full Vibrant Official Logo */}
            <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? '3. الشعار المكتمل' : '3. Full Color Logo'}
              </span>
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/logo-color.png" alt="Full Color" className="w-14 h-14 object-contain drop-shadow-md" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">
                {isAr ? 'اكتمل التحميل' : 'Fully loaded'}
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Clean Brand Footer */}
      <footer className="w-full py-6 border-t border-slate-200 relative z-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
          <p>© 2026 Rawy. All rights reserved. Powered by Albumii.</p>
          <div className="flex items-center gap-5">
            <a href="/policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#F78F50] transition-colors">
              {lang.privacyPolicy}
            </a>
            <a href="/tos.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#F78F50] transition-colors">
              {lang.termsOfService}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default WelcomeScreen;
