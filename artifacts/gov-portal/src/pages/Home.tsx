import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Accessibility,
  Menu,
  X,
  FileText,
  SearchCode,
  MessageSquare,
  ShieldCheck,
  FileBadge,
  Car,
  Users,
  PhoneCall,
  CalendarDays,
  ArrowLeft,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import Chatbot from "../components/Chatbot";

const TopBar = () => (
  <div className="bg-primary text-primary-foreground text-xs font-medium py-2 px-4 md:px-8 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <button
        className="flex items-center gap-1.5 hover:text-accent transition-colors"
        title="إمكانية الوصول"
      >
        <Accessibility size={14} />
        <span className="hidden sm:inline">إمكانية الوصول</span>
      </button>
      <div className="w-[1px] h-3 bg-white/20"></div>
      <button className="flex items-center gap-1.5 hover:text-accent transition-colors">
        <Globe size={14} />
        <span>English</span>
      </button>
    </div>
    <div className="text-right">بوابة منصة سند التجريبية </div>
  </div>
);

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md py-2"
            : "bg-white py-4"
        } border-b-[3px] border-accent`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            {/* الشعار من مجلد public */}
            <img
              src="/sanad-logo.png"
              alt="شعار سند"
              className="h-10 w-auto object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-2xl md:text-3xl text-primary tracking-wide">
                سند
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c8a84b] text-white tracking-wider">
                  BETA
                </span>
                <span className="text-[11px] text-[#1a5c38]/70 font-medium hidden sm:inline">
                  نسخة تجريبية
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-[15px]">
            {[
              "الرئيسية",
              "عن المنصة",
              "الأخبار",
              "الخدمات الإلكترونية",
              "التواصل الاجتماعي",
              "اتصل بنا",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="text-foreground hover:text-accent transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="text-primary hover:text-accent p-2 rounded-full hover:bg-secondary transition-colors">
              <Search size={20} />
            </button>
            <div className="flex items-center gap-2 text-primary">
              <a href="#" className="hover:text-accent">
                <Twitter size={18} />
              </a>
              <a href="#" className="hover:text-accent">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[100px] left-0 w-full bg-white shadow-xl z-40 border-b border-border lg:hidden"
          >
            <div className="flex flex-col p-4 font-bold text-foreground divide-y divide-border">
              {[
                "الرئيسية",
                "عن المنصة",
                "الأخبار",
                "الخدمات الإلكترونية",
                "التواصل الاجتماعي",
                "اتصل بنا",
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="py-4 px-2 hover:text-primary hover:bg-secondary"
                >
                  {item}
                </a>
              ))}
              <div className="flex items-center gap-4 py-4 px-2">
                <Search className="text-primary" size={20} />
                <span className="text-muted-foreground font-normal">
                  بحث في البوابة...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const HeroBanner = () => {
  return (
    <div className="relative w-full h-[500px] bg-primary overflow-hidden flex items-center justify-center">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-pattern opacity-60"></div>

      {/* Vignette/gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-transparent"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-heading font-bold text-5xl md:text-7xl text-accent drop-shadow-md"
          style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
        >
          في خدمة الوطن والمواطن
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-2xl font-medium max-w-3xl mx-auto text-white/90"
        >
          نعمل معاً لتحقيق رؤية 2030
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="bg-primary border-2 border-accent text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-accent hover:text-primary transition-all duration-300 shadow-[0_0_15px_rgba(200,168,75,0.4)]">
            الخدمات الإلكترونية
          </button>
        </motion.div>
      </div>

      {/* Bottom Gold Divider */}
      <div className="absolute bottom-0 w-full h-1.5 bg-accent"></div>
    </div>
  );
};

const QuickServices = () => {
  const services = [
    { icon: FileText, label: "تقديم الطلبات" },
    { icon: SearchCode, label: "الاستعلام عن الطلبات" },
    { icon: MessageSquare, label: "الشكاوى والمقترحات" },
    { icon: FileBadge, label: "التراخيص" },
    { icon: ShieldCheck, label: "التوثيق الرسمي" },
    { icon: Car, label: "خدمات المرور" },
    { icon: Users, label: "الخدمات الاجتماعية" },
    { icon: PhoneCall, label: "التواصل المباشر" },
  ];

  return (
    <div className="relative -mt-10 z-20 max-w-7xl mx-auto px-4 md:px-8 mb-16">
      <div
        className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {services.map((svc, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className="flex-shrink-0 w-32 h-32 md:w-36 md:h-36 bg-white rounded-xl shadow-lg border border-border flex flex-col items-center justify-center gap-3 snap-center cursor-pointer hover:border-accent hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-full bg-secondary text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-accent transition-colors">
              <svc.icon size={24} />
            </div>
            <span className="font-bold text-sm text-center px-2 text-foreground group-hover:text-primary transition-colors">
              {svc.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-10 text-center md:text-right">
    <h2 className="font-heading font-bold text-3xl text-primary inline-block relative pb-3">
      {title}
      <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-accent rounded-full"></div>
    </h2>
  </div>
);

const NewsSection = () => {
  const news = [
    {
      date: "٢٠ يوليو ٢٠٢٦",
      category: "أخبار المنصة",
      title:
        "إدارة المنصة ترعى حفل تخريج دفعة جديدة من خريجي برامج التدريب المهني",
      excerpt:
        "شهدت إدارة المنصة اليوم حفل تخريج الدفعة الجديدة من متدربي برامج التوطين والتدريب المهني...",
    },
    {
      date: "١٨ يوليو ٢٠٢٦",
      category: "رؤية 2030",
      title:
        "إطلاق مبادرة التحول الرقمي لتطوير خدمات المنصة تماشياً مع رؤية 2030",
      excerpt:
        "أعلنت المنصة عن الإطلاق الرسمي للمنصة الرقمية الموحدة التي تهدف إلى تسريع الإجراءات ورفع كفاءة الخدمات...",
    },
    {
      date: "١٥ يوليو ٢٠٢٦",
      category: "شراكات واستثمار",
      title: "المنصة تستقبل وفداً دولياً لبحث فرص الاستثمار والتعاون المشترك",
      excerpt:
        "استقبلت المنصة اليوم وفداً من المستثمرين لتعزيز سبل التعاون في قطاعات النقل والخدمات اللوجستية...",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader title="آخر الأخبار والبيانات الرسمية" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              key={i}
              className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
            >
              <div className="h-2 w-full bg-primary"></div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-3 py-1 bg-accent text-primary rounded-full">
                    {item.category}
                  </span>
                  <div className="flex items-center text-muted-foreground text-xs font-medium gap-1">
                    <CalendarDays size={14} />
                    <span>{item.date}</span>
                  </div>
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="text-secondary-foreground text-sm mb-6 flex-grow leading-relaxed">
                  {item.excerpt}
                </p>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary font-bold text-sm hover:text-accent transition-colors mt-auto w-fit"
                >
                  <span>اقرأ المزيد</span>
                  <ArrowLeft size={16} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const EServicesSection = () => {
  const services = [
    {
      icon: FileText,
      title: "نظام تقديم الطلبات الإلكترونية",
      desc: "تقديم طلباتك وتتبعها إلكترونياً بسهولة وسرعة من خلال منصة موحدة وآمنة.",
    },
    {
      icon: SearchCode,
      title: "الاستعلام عن معاملاتك",
      desc: "تعرف على حالة معاملاتك الحكومية في أي وقت ومن أي مكان بخطوات بسيطة.",
    },
    {
      icon: ShieldCheck,
      title: "خدمة التوثيق والتصديق",
      desc: "خدمات توثيق الوثائق الرسمية والتصديق عليها إلكترونياً لضمان موثوقيتها.",
    },
    {
      icon: MessageSquare,
      title: "تقديم الشكاوى والمقترحات",
      desc: "شاركنا برأيك وساعدنا في تطوير خدماتنا لخدمتك بشكل أفضل وتلبية تطلعاتك.",
    },
  ];

  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader title="الخدمات الإلكترونية" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((svc, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:border-primary hover:shadow-md transition-all duration-300 flex flex-col h-[220px]"
            >
              <div className="flex items-start gap-4 h-full">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                  <svc.icon size={32} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col h-full">
                  <h3 className="font-heading font-bold text-xl text-primary mb-2">
                    {svc.title}
                  </h3>
                  <p className="text-secondary-foreground text-sm leading-relaxed mb-4 flex-grow">
                    {svc.desc}
                  </p>
                  <button className="bg-primary/5 text-primary font-bold py-2 px-6 rounded-lg self-start hover:bg-primary hover:text-accent border border-transparent hover:border-accent transition-all">
                    الدخول للخدمة
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AnimatedCounter = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => {
  return (
    <div className="text-center flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading font-bold text-4xl md:text-5xl text-accent mb-2"
        style={{ direction: "ltr" }} // numbers typically ltr
      >
        {value}
      </motion.div>
      <div className="text-white/90 font-bold text-sm md:text-base">
        {label}
      </div>
    </div>
  );
};

const Statistics = () => {
  return (
    <section className="py-16 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-30"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-x-reverse divide-white/10">
          <AnimatedCounter value="+٢٠٠,٠٠٠" label="مواطن مستفيد" />
          <AnimatedCounter value="+١,٢٠٠" label="موظف لخدمتكم" />
          <AnimatedCounter value="+٥٠0" label="خدمة إلكترونية" />
          <AnimatedCounter value="٩٨٪" label="رضا المستفيدين" />
        </div>
      </div>
    </section>
  );
};

const MediaCenter = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader title="المركز الإعلامي والتواصل الاجتماعي" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* منصة إكس  */}
          <a
            href="#"
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-[#1a5c38]/5 border border-[#1a5c38]/20 hover:bg-[#1a5c38]/10 transition-colors group"
          >
            <div className="w-16 h-16 bg-[#1a5c38] rounded-full text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Twitter size={32} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2"> إكس</h3>
            <p className="text-sm text-secondary-foreground">
              تابع آخر التحديثات والأخبار العاجلة الصادرة عن المنصة
            </p>
          </a>

          {/*قناة  */}
          <a
            href="#"
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-[#1a5c38]/5 border border-[#1a5c38]/20 hover:bg-[#1a5c38]/10 transition-colors group"
          >
            <div className="w-16 h-16 bg-[#1a5c38] rounded-full text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Youtube size={32} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">يوتيوب</h3>
            <p className="text-sm text-secondary-foreground">
              شاهد التغطيات المرئية والبرامج الوثائقية للمنطقة
            </p>
          </a>

          {/* انستغرام */}
          <a
            href="#"
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-[#1a5c38]/5 border border-[#1a5c38]/20 hover:bg-[#1a5c38]/10 transition-colors group"
          >
            <div className="w-16 h-16 bg-[#1a5c38] rounded-full text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Instagram size={32} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">انستغرام</h3>
            <p className="text-sm text-secondary-foreground">
              استكشف جمال وتراث المنطقة من خلال عدسة المنصة
            </p>
          </a>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-primary text-white border-t-[4px] border-accent">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Brand/About */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div>
                <div className="font-heading font-black text-2xl text-accent leading-tight">
                  سند
                </div>
                <div className="font-heading font-bold text-sm text-white/80 leading-tight">
                  المنصة التجريبية
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              نسعى لتقديم أرقى الخدمات للمواطنين والمقيمين والزوار، وتحقيق
              التنمية المستدامة في المنطقة بما يتوافق مع رؤية المملكة العربية
              السعودية 2030.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-accent">
              روابط سريعة
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  عن المنصة
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  فريق المنصة
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  الدعم الفني
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  الهيكل التنظيمي
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  المحافظات والمراكز
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-accent">
              البوابات الحكومية
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  بوابة أبشر
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  وزارة الداخلية
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  منصة اعتماد
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  رؤية السعودية 2030
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  المنصة الوطنية الموحدة
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-accent">
              تواصل معنا
            </h4>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex items-start gap-3">
                <Globe className="text-accent shrink-0 mt-0.5" size={18} />
                <span>المملكة العربية السعودية</span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneCall className="text-accent shrink-0" size={18} />
                <span dir="ltr">+966 50 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare className="text-accent shrink-0" size={18} />
                <span>info@beta-sand.gov.sa</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-white/60">
            حقوق النشر © ٢٠٢٦{" "}
            <span className="text-accent font-bold">منصة سند التجريبية</span>.
            جميع الحقوق محفوظة.
          </div>
          <div className="flex gap-4 text-white/60">
            <a href="#" className="hover:text-white transition-colors">
              سياسة الخصوصية
            </a>
            <a href="#" className="hover:text-white transition-colors">
              شروط الاستخدام
            </a>
            <a href="#" className="hover:text-white transition-colors">
              ميثاق العملاء
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      <TopBar />
      <Header />
      <main>
        <HeroBanner />
        <QuickServices />
        <NewsSection />
        <EServicesSection />
        <Statistics />
        <MediaCenter />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
