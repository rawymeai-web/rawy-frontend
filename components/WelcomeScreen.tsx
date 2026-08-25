import React, { useState, useEffect } from 'react';
import type { Language } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const COVER_METADATA = [
  {
    src: '/covers/cover2.png',
    title: { ar: 'مهمة مسبار الأمل', en: 'The Hope Probe Mission' },
    subtitle: { ar: 'رحلة المريخ نحو النجوم', en: 'Beyond the Stars to Mars' },
    border: 'border-[#193056]'
  },
  {
    src: '/covers/cover3.png',
    title: { ar: 'سحر ألف ليلة وليلة', en: '1001 Nights Magic' },
    subtitle: { ar: 'مغامرة البساط السحري', en: 'The Flying Carpet Adventure' },
    border: 'border-[#006b5d]'
  },
  {
    src: '/covers/cover4.png',
    title: { ar: 'مغامرة الأعماق الزرقاء', en: 'Deep Blue Odyssey' },
    subtitle: { ar: 'أسرار الشعب المرجانية', en: 'Secrets of the Coral Reef' },
    border: 'border-[#0f547c]'
  },
  {
    src: '/covers/cover5.png',
    title: { ar: 'وادي الديناصورات', en: 'The Dinosaur Valley' },
    subtitle: { ar: 'أرض العمالقة اللطفاء', en: 'Land of the Gentle Giants' },
    border: 'border-[#4b6a15]'
  },
  {
    src: '/covers/cover6.png',
    title: { ar: 'الغابة السحرية', en: 'Whispering Woods' },
    subtitle: { ar: 'أرض الحيوانات المتكلمة', en: 'The Forest of Talking Animals' },
    border: 'border-[#8f5a1d]'
  },
  {
    src: '/covers/cover7.png',
    title: { ar: 'منطاد السماء', en: 'Skyward Balloonist' },
    subtitle: { ar: 'التحليق فوق السحاب', en: 'Floating Above the Clouds' },
    border: 'border-[#e69b00]'
  },
  {
    src: '/covers/cover8.png',
    title: { ar: 'مملكة الكريستال', en: 'The Crystal Kingdom' },
    subtitle: { ar: 'البحث عن قصر الجليد', en: 'Quest for the Ice Palace' },
    border: 'border-[#1c4b75]'
  }
];

interface TranslationStrings {
  heroTag: string;
  headingPrefix: string;
  heroWord: string;
  headingSuffix: string;
  subheading: string;
  ctaButton: string;
  badge1: string;
  badge2: string;
  badge3: string;
  customStoryBadge: string;
  privacyPolicy: string;
  termsOfService: string;
}

const TRANSLATIONS: Record<Language, TranslationStrings> = {
  ar: {
    heroTag: 'هدية ساحرة ومخصصة تدوم للأبد',
    headingPrefix: 'اجعل طفلك',
    heroWord: 'بطل',
    headingSuffix: 'قصته الخاصة 📖',
    subheading: 'كتاب مصور فاخر مطبوع باسم طفلك وملامحه في مغامرة شيقة يختارها بنفسه.',
    ctaButton: '✨ ابدأ تخصيص كتاب طفلك الآن',
    badge1: '⚡ تخصيص كامل في دقيقة واحدة',
    badge2: '📖 غلاف مقوى فاخر',
    badge3: '🚚 شحن سريع لجميع الدول',
    customStoryBadge: 'قصة مخصصة',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة'
  },
  en: {
    heroTag: 'A Magical Personalized Gift That Lasts Forever',
    headingPrefix: 'Turn Your Child Into the',
    heroWord: 'Hero',
    headingSuffix: 'of Their Own Story 📖',
    subheading: 'A premium personalized hardcover storybook featuring your child’s name and likeness.',
    ctaButton: '✨ Create Your Child\'s Book Now',
    badge1: '⚡ 1-Minute Customization',
    badge2: '📖 Premium Hardcover',
    badge3: '🚚 Fast Worldwide Delivery',
    customStoryBadge: 'Personalized Story',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service'
  },
  de: {
    heroTag: 'Ein magisches personalisiertes Geschenk für immer',
    headingPrefix: 'Mach dein Kind zum',
    heroWord: 'Helden',
    headingSuffix: 'seiner eigenen Geschichte 📖',
    subheading: 'Ein edles personalisiertes Buch mit dem Namen und dem Aussehen Ihres Kindes.',
    ctaButton: '✨ Jetzt Kinderbuch gestalten',
    badge1: '⚡ In 1 Minute gestaltet',
    badge2: '📖 Edles Hardcover',
    badge3: '🚚 Weltweiter Schnellversand',
    customStoryBadge: 'Personalisiertes Buch',
    privacyPolicy: 'Datenschutz',
    termsOfService: 'AGB'
  },
  tr: {
    heroTag: 'Ömür Boyu Sürecek Sihirli Kişiselleştirilmiş Bir Hediye',
    headingPrefix: 'Çocuğunuzu Kendi Hikayesinin',
    heroWord: 'Kahramanı',
    headingSuffix: 'Yapın 📖',
    subheading: 'Çocuğunuzun adı ve yüzüyle tasarlanmış unutulmaz bir özel hikaye kitabı.',
    ctaButton: '✨ Çocuğunuzun Kitabını Şimdi Oluşturun',
    badge1: '⚡ 1 Dakikada Tasarım',
    badge2: '📖 Lüks Sert Kapak',
    badge3: '🚚 Tüm Dünyaya Hızlı Kargo',
    customStoryBadge: 'Kişiye Özel Kitap',
    privacyPolicy: 'Gizlilik Politikası',
    termsOfService: 'Kullanım Şartları'
  },
  zh: {
    heroTag: '一份伴随一生的神奇定制礼物',
    headingPrefix: '让您的孩子成为自己故事的',
    heroWord: '主角',
    headingSuffix: '📖',
    subheading: '精美定制精装绘本，印有您孩子的姓名和专属插画形象。',
    ctaButton: '✨ 立即定制儿童绘本',
    badge1: '⚡ 1分钟极速定制',
    badge2: '📖 高端精装硬壳',
    badge3: '🚚 全球快速配送',
    customStoryBadge: '专属定制故事',
    privacyPolicy: '隐私政策',
    termsOfService: '服务条款'
  },
  ja: {
    heroTag: '一生の宝物になる魔法のパーソナライズ絵本',
    headingPrefix: 'お子さまが',
    heroWord: '主人公',
    headingSuffix: 'になる世界でたったひとつの絵本 📖',
    subheading: 'お子さまのお名前とお顔のイラストが入った、特別仕立てのハードカバー絵本。',
    ctaButton: '✨ 今すぐ絵本をつくる',
    badge1: '⚡ 1分でかんたん作成',
    badge2: '📖 高級ハードカバー',
    badge3: '🚚 世界中へスピード配送',
    customStoryBadge: 'オリジナル絵本',
    privacyPolicy: 'プライバシーポリシー',
    termsOfService: '利用規約'
  },
  fr: {
    heroTag: 'Un cadeau magique et personnalisé pour toujours',
    headingPrefix: 'Faites de votre enfant le',
    heroWord: 'héros',
    headingSuffix: 'de sa propre histoire 📖',
    subheading: 'Un livre d\'histoire personnalisé haut de gamme avec le nom et les traits de votre enfant.',
    ctaButton: '✨ Créer le livre de votre enfant',
    badge1: '⚡ Personnalisation en 1 min',
    badge2: '📖 Couverture rigide premium',
    badge3: '🚚 Livraison rapide mondiale',
    customStoryBadge: 'Histoire personnalisée',
    privacyPolicy: 'Politique de confidentialité',
    termsOfService: 'Conditions d\'utilisation'
  },
  es: {
    heroTag: 'Un regalo mágico y personalizado para siempre',
    headingPrefix: 'Haz que tu hijo sea el',
    heroWord: 'héroe',
    headingSuffix: 'de su propia historia 📖',
    subheading: 'Un libro personalizado prémium con el nombre y los rasgos de tu hijo.',
    ctaButton: '✨ Crea el libro de tu hijo ahora',
    badge1: '⚡ Personalización en 1 minuto',
    badge2: '📖 Tapa dura de lujo',
    badge3: '🚚 Envío rápido mundial',
    customStoryBadge: 'Historia personalizada',
    privacyPolicy: 'Política de privacidad',
    termsOfService: 'Términos de servicio'
  },
  it: {
    heroTag: 'Un regalo magico e personalizzato per sempre',
    headingPrefix: 'Rendi tuo figlio il',
    heroWord: 'protagonista',
    headingSuffix: 'della sua storia 📖',
    subheading: 'Un libro illustrato personalizzato di alta qualità con il nome e il volto di tuo figlio.',
    ctaButton: '✨ Crea subito il libro per tuo figlio',
    badge1: '⚡ Personalizzazione in 1 minuto',
    badge2: '📖 Copertina rigida premium',
    badge3: '🚚 Spedizione rapida nel mondo',
    customStoryBadge: 'Storia personalizzata',
    privacyPolicy: 'Informativa sulla privacy',
    termsOfService: 'Termini di servizio'
  },
  pt: {
    heroTag: 'Um presente mágico e personalizado para sempre',
    headingPrefix: 'Torne seu filho o',
    heroWord: 'herói',
    headingSuffix: 'da sua própria história 📖',
    subheading: 'Um livro personalizado de capa dura com o nome e as feições do seu filho.',
    ctaButton: '✨ Crie o livro do seu filho agora',
    badge1: '⚡ Personalização em 1 minuto',
    badge2: '📖 Capa dura premium',
    badge3: '🚚 Envio rápido para o mundo todo',
    customStoryBadge: 'História personalizada',
    privacyPolicy: 'Política de privacidade',
    termsOfService: 'Termos de serviço'
  },
  ru: {
    heroTag: 'Волшебный персонализированный подарок на всю жизнь',
    headingPrefix: 'Сделайте вашего ребенка',
    heroWord: 'героем',
    headingSuffix: 'его собственной сказки 📖',
    subheading: 'Красочная книга в твердом переплете с именем и внешностью вашего ребенка.',
    ctaButton: '✨ Создать книгу для ребенка',
    badge1: '⚡ Создание за 1 минуту',
    badge2: '📖 Твердый переплет премиум',
    badge3: '🚚 Быстрая доставка по всему миру',
    customStoryBadge: 'Именная сказка',
    privacyPolicy: 'Политика конфиденциальности',
    termsOfService: 'Условия использования'
  }
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, language }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % COVER_METADATA.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const lang = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isAr = language === 'ar';

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Next slide
        setCurrentSlide((prev) => (prev + 1) % COVER_METADATA.length);
      } else {
        // Prev slide
        setCurrentSlide((prev) => (prev - 1 + COVER_METADATA.length) % COVER_METADATA.length);
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="text-[#243A61] font-sans overflow-x-hidden flex flex-col relative w-full min-h-[calc(100vh-80px)] justify-between">
      
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-30 bg-[#006b5d]"></div>
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-40 bg-[#F78F50]/20"></div>
        <div className="absolute bottom-[-10%] left-[30%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-30 bg-amber-200/40"></div>
      </div>

      {/* Main Hero Container */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 sm:px-6 py-4 md:py-8 max-w-6xl mx-auto w-full">
        
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200/80 shadow-sm text-brand-navy mb-4 animate-fade-in">
          <span className="text-sm">✨</span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#F78F50]">
            {lang.heroTag}
          </span>
        </div>

        {/* Ultra-Lean Catchy Headline */}
        <div className="text-center max-w-3xl space-y-3 mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#001a40] tracking-tight leading-[1.15] drop-shadow-sm">
            {lang.headingPrefix}{' '}
            <span className="relative inline-block text-[#F78F50]">
              {lang.heroWord}
              <svg className="absolute -bottom-1 left-0 w-full h-2 text-[#F78F50]/40" preserveAspectRatio="none" viewBox="0 0 100 10">
                <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4"></path>
              </svg>
            </span>{' '}
            {lang.headingSuffix}
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-medium text-[#554339]/80 max-w-xl mx-auto leading-relaxed">
            {lang.subheading}
          </p>
        </div>

        {/* 3D Storybook Showcase (Front and Center) */}
        <div 
          className="w-full max-w-[340px] sm:max-w-md md:max-w-lg mb-8 relative group cursor-pointer"
          onClick={onStart}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Ambient Lighting & Shadow */}
          <div className="absolute inset-0 bg-black/25 rounded-3xl blur-2xl transform translate-y-6 scale-95 transition-all group-hover:scale-100 group-hover:blur-3xl group-hover:bg-[#F78F50]/20"></div>

          {/* Book Container with 3D Depth */}
          <div className="relative aspect-square w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 md:border-[6px] border-white/90 bg-slate-100 transition-transform duration-500 group-hover:scale-[1.02]">
            
            {/* Book Spine Crease Shadow (3D Effect) */}
            <div className={`absolute top-0 bottom-0 ${isAr ? 'right-0 border-r-[10px]' : 'left-0 border-l-[10px]'} border-black/25 z-20 pointer-events-none w-3 bg-gradient-to-r ${isAr ? 'from-transparent to-black/30' : 'from-black/30 to-transparent'}`}></div>

            {/* Slides */}
            {COVER_METADATA.map((cover, index) => (
              <div 
                key={index} 
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img 
                  alt={isAr ? cover.title.ar : cover.title.en} 
                  className="w-full h-full object-cover select-none" 
                  src={cover.src} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10"></div>
                
                {/* Book Title Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-10 px-4 text-center text-white">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-amber-200 mb-2 border border-white/20">
                    {lang.customStoryBadge}
                  </span>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black drop-shadow-md">
                    {isAr ? cover.title.ar : cover.title.en}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-white/90 italic drop-shadow-sm mt-0.5">
                    {isAr ? cover.subtitle.ar : cover.subtitle.en}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Navigation Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {COVER_METADATA.map((_, index) => (
              <button 
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }} 
                className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-6 bg-[#F78F50]' : 'w-1.5 bg-brand-navy/20 hover:bg-brand-navy/40'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Prominent, Unmissable CTA Button (Thumb Zone) */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <button 
            onClick={onStart}
            className="w-full text-lg sm:text-xl md:text-2xl font-black py-4 sm:py-5 px-8 rounded-full shadow-[0_12px_30px_rgba(247,143,80,0.4)] hover:shadow-[0_16px_40px_rgba(247,143,80,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 relative overflow-hidden group bg-[#F78F50] text-white" 
            id="btn_start_journey"
          >
            {/* Shimmer Highlight */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <span>{lang.ctaButton}</span>
            <span className="material-symbols-outlined font-black text-xl md:text-2xl">
              {isAr ? 'arrow_back' : 'arrow_forward'}
            </span>
          </button>

          {/* 3 Trust Micro-Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-bold text-brand-navy/70 pt-1">
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{lang.badge1}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-brand-navy/20 hidden sm:block"></div>
            <div className="flex items-center gap-1">
              <span>📖</span>
              <span>{lang.badge2}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-brand-navy/20 hidden sm:block"></div>
            <div className="flex items-center gap-1">
              <span>🚚</span>
              <span>{lang.badge3}</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer with legal links required by Google verification */}
      <footer className="w-full py-4 mt-6 border-t border-brand-navy/5 relative z-10 bg-white/40 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-semibold text-brand-navy/40">
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
