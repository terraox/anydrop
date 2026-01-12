import { FirstBentoAnimation } from "@/components/first-bento-animation";
import { FourthBentoAnimation } from "@/components/fourth-bento-animation";
import { SecondBentoAnimation } from "@/components/second-bento-animation";
import { ThirdBentoAnimation } from "@/components/third-bento-animation";
import { SecureGrowthVisual, ScalableGrowthVisual } from "@/components/sections/growth-visuals";
import { cn } from "@/lib/utils";

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "p-1 py-0.5 font-medium dark:font-semibold text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
};

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "AnyDrop",
  description: "Seamless cross-device file sharing.",
  cta: "Get Started",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "File Sharing",
    "Cross-device",
    "P2P",
    "AnyDrop",
  ],
  links: {
    email: "support@anydrop.app",
    twitter: "https://twitter.com/anydrop",
    discord: "https://discord.gg/anydrop",
    github: "https://github.com/anydrop",
    instagram: "https://instagram.com/anydrop",
  },
  nav: {
    links: [
      { id: 1, name: "Home", href: "#hero" },
      { id: 2, name: "How it Works", href: "#bento" },
      { id: 3, name: "Features", href: "#features" },
      { id: 4, name: "Pricing", href: "#pricing" },
    ],
  },
  hero: {
    badgeIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dark:fill-white fill-[#364153]"
      >
        <path d="M7.62758 1.09876C7.74088 1.03404 7.8691 1 7.99958 1C8.13006 1 8.25828 1.03404 8.37158 1.09876L13.6216 4.09876C13.7363 4.16438 13.8316 4.25915 13.8979 4.37347C13.9642 4.48779 13.9992 4.6176 13.9992 4.74976C13.9992 4.88191 13.9642 5.01172 13.8979 5.12604C13.8316 5.24036 13.7363 5.33513 13.6216 5.40076L8.37158 8.40076C8.25828 8.46548 8.13006 8.49952 7.99958 8.49952C7.8691 8.49952 7.74088 8.46548 7.62758 8.40076L2.37758 5.40076C2.26287 5.33513 2.16753 5.24036 2.10123 5.12604C2.03492 5.01172 2 4.88191 2 4.74976C2 4.6176 2.03492 4.48779 2.10123 4.37347C2.16753 4.25915 2.26287 4.16438 2.37758 4.09876L7.62758 1.09876Z" />
        <path d="M2.56958 7.23928L2.37758 7.34928C2.26287 7.41491 2.16753 7.50968 2.10123 7.624C2.03492 7.73831 2 7.86813 2 8.00028C2 8.13244 2.03492 8.26225 2.10123 8.37657C2.16753 8.49089 2.26287 8.58566 2.37758 8.65128L7.62758 11.6513C7.74088 11.716 7.8691 11.75 7.99958 11.75C8.13006 11.75 8.25828 11.716 8.37158 11.6513L13.6216 8.65128C13.7365 8.58573 13.8321 8.49093 13.8986 8.3765C13.965 8.26208 14 8.13211 14 7.99978C14 7.86745 13.965 7.73748 13.8986 7.62306C13.8321 7.50864 13.7365 7.41384 13.6216 7.34828L13.4296 7.23828L9.11558 9.70328C8.77568 9.89744 8.39102 9.99956 7.99958 9.99956C7.60814 9.99956 7.22347 9.89744 6.88358 9.70328L2.56958 7.23928Z" />
        <path d="M2.37845 10.5993L2.57045 10.4893L6.88445 12.9533C7.22435 13.1474 7.60901 13.2496 8.00045 13.2496C8.39189 13.2496 8.77656 13.1474 9.11645 12.9533L13.4305 10.4883L13.6225 10.5983C13.7374 10.6638 13.833 10.7586 13.8994 10.8731C13.9659 10.9875 14.0009 11.1175 14.0009 11.2498C14.0009 11.3821 13.9659 11.5121 13.8994 11.6265C13.833 11.7409 13.7374 11.8357 13.6225 11.9013L8.37245 14.9013C8.25915 14.966 8.13093 15 8.00045 15C7.86997 15 7.74175 14.966 7.62845 14.9013L2.37845 11.9013C2.2635 11.8357 2.16795 11.7409 2.10148 11.6265C2.03501 11.5121 2 11.3821 2 11.2498C2 11.1175 2.03501 10.9875 2.10148 10.8731C2.16795 10.7586 2.2635 10.6638 2.37845 10.5983V10.5993Z" />
      </svg>
    ),
    badge: "Seamless File Transfer",
    title: "Share Files Instantly Across Devices",
    description:
      "Simple, fast, and secure file sharing between your mobile and desktop devices without the hassle.",
    cta: {
      primary: {
        text: "Try for Free",
        href: "#",
      },
      secondary: {
        text: "Log in",
        href: "#",
      },
    },
  },
  companyShowcase: {
    companyLogos: [
      {
        id: 1,
        name: "Reliance",
        logo: (
          <svg
            width="120"
            height="30"
            viewBox="0 0 120 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">RELIANCE</text>
          </svg>
        ),
      },
      {
        id: 2,
        name: "Tata",
        logo: (
          <svg
            width="80"
            height="30"
            viewBox="0 0 80 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">TATA</text>
          </svg>
        ),
      },
      {
        id: 3,
        name: "Infosys",
        logo: (
          <svg
            width="100"
            height="30"
            viewBox="0 0 100 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">INFOSYS</text>
          </svg>
        ),
      },
      {
        id: 4,
        name: "Wipro",
        logo: (
          <svg
            width="90"
            height="30"
            viewBox="0 0 90 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">WIPRO</text>
          </svg>
        ),
      },
      {
        id: 5,
        name: "Airtel",
        logo: (
          <svg
            width="90"
            height="30"
            viewBox="0 0 90 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">AIRTEL</text>
          </svg>
        ),
      },
      {
        id: 6,
        name: "HDFC",
        logo: (
          <svg
            width="80"
            height="30"
            viewBox="0 0 80 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">HDFC</text>
          </svg>
        ),
      },
      {
        id: 7,
        name: "Mahindra",
        logo: (
          <svg
            width="120"
            height="30"
            viewBox="0 0 120 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">MAHINDRA</text>
          </svg>
        ),
      },
      {
        id: 8,
        name: "HCL",
        logo: (
          <svg
            width="70"
            height="30"
            viewBox="0 0 70 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:fill-white fill-black"
          >
            <text x="0" y="22" fontSize="18" fontWeight="bold" fontFamily="system-ui">HCL</text>
          </svg>
        ),
      },
    ],
  },
  featureSection: {
    title: "Simple. Fast. Secure.",
    description:
      "See how AnyDrop makes file sharing effortless in just a few steps",
    items: [
      {
        id: 1,
        title: "Upload Your Files",
        content:
          "Choose any file, photo, or document you want to share. AnyDrop handles all file types with ease.",
        image: "/upload-files.jpeg",
      },
      {
        id: 2,
        title: "Choose Your Device",
        content:
          "AnyDrop automatically discovers nearby devices on your network. Select the one you want to send to.",
        image: "/choose-your-device.png",
      },
      {
        id: 3,
        title: "Confirm and Transfer",
        content:
          "One tap to confirm and your files start transferring instantly at blazing fast local network speeds.",
        image: "/confirm-and-transfer.png",
      },
      {
        id: 4,
        title: "Access Anywhere",
        content:
          "Your files arrive safely on the destination device. Access them anytime, anywhere you need them.",
        image: "/access-anywhere.png",
      },
    ],
  },
  bentoSection: {
    title: "Share Without Limits",
    description:
      "Experience the freedom of truly universal file dropping. Local network speed, internet convenience.",
    items: [
      {
        id: 1,
        content: <FirstBentoAnimation />,
        title: "Instant Local Transfers",
        description:
          "Share files at lightning speed between devices on the same network. No internet needed, just pure local power.",
      },
      {
        id: 2,
        content: <SecondBentoAnimation />,
        title: "Connect All Your Devices",
        description:
          "Phone, laptop, tablet, smartwatch – AnyDrop discovers and connects to all your devices instantly. One tap to share anywhere.",
      },
      {
        id: 3,
        content: (
          <ThirdBentoAnimation
            data={[20, 30, 25, 45, 40, 55, 75]}
            toolTipValues={[
              1234, 1678, 2101, 2534, 2967, 3400, 3833, 4266, 4700, 5133,
            ]}
          />
        ),
        title: "Millions of Files Shared Daily",
        description:
          "Join thousands of users transferring millions of files every day. Fast, reliable, and growing stronger with every share.",
      },
      {
        id: 4,
        content: <FourthBentoAnimation once={false} />,
        title: "24/7 Always Available",
        description:
          "AnyDrop is ready whenever you are. Transfer files any time of day, any day of the week – we never sleep so you can share anytime.",
      },
    ],
  },
  benefits: [
    {
      id: 1,
      text: "Save hours each week with AI-optimized scheduling.",
      image: "/Device-6.png",
    },
    {
      id: 2,
      text: "Reduce scheduling conflicts and double-bookings.",
      image: "/Device-7.png",
    },
    {
      id: 3,
      text: "Improve work-life balance with smart time allocation.",
      image: "/Device-8.png",
    },
    {
      id: 4,
      text: "Increase productivity with AI-driven time management insights.",
      image: "/Device-1.png",
    },
  ],
  growthSection: {
    title: "Built for Secure Sharing",
    description:
      "Where advanced security meets seamless file transfers—designed to protect your files and simplify your sharing.",
    items: [
      {
        id: 1,
        content: <SecureGrowthVisual />,

        title: "End-to-End Encryption",
        description:
          "Your files are protected with military-grade encryption. Only you and your recipient can access what you share.",
      },
      {
        id: 2,
        content: <ScalableGrowthVisual />,
        backgroundImage: "/agent-cta-background.png",
        button: {
          text: "Start Your 30-Day Free Trial Today",
          href: "#",
        },
        subtext: "Cancel anytime, no questions asked",
      },
    ],
  },
  ctaSection: {
    title: "Start Sharing Instantly",
    backgroundImage: "/agent-cta-background.png",
    button: {
      text: "Get Started Now",
      href: "#",
    },
    subtext: "",
  },
  faqSection: {
    title: "Frequently Asked Questions",
    description: "Everything you need to know about AnyDrop.",
    faQitems: [
      {
        question: "Is AnyDrop free?",
        answer: "Yes, AnyDrop enables unlimited local file transfers for free. Cloud transfers may have limits on the free tier.",
      },
      {
        question: "How secure is it?",
        answer:
          "We use end-to-end encryption for all transfers. Your files are never stored on our servers for local transfers.",
      },
      {
        question: "What platforms are supported?",
        answer:
          "AnyDrop works on iOS, Android, Windows, macOS, and Linux via any modern web browser.",
      },
    ],
  },
  quoteSection: {
    quote:
      "AnyDrop has revolutionized how our design team shares assets. It's faster than AirDrop and works across all our devices seamlessly.",
    author: {
      name: "Dhruvil Parekh",
      role: "Training Head, ThynkTech",
      image: "/dhruvil.jpeg",
    },
  },
  pricing: {
    title: "Simple Pricing",
    description: "Choose the plan that fits your sharing needs.",
    pricingItems: [
      {
        name: "Free",
        price: "₹0",
        yearlyPrice: "₹0",
        description: "Perfect for casual sharing",
        features: [
          "Up to 2GB per file",
          "5 transfers per day",
          "1GB Cloud Storage",
          "5MB/s transfer speed",
        ],
        buttonText: "Get Started Free",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: false,
      },
      {
        name: "Pro",
        price: "₹499",
        yearlyPrice: "₹3,999",
        description: "For power users & teams",
        features: [
          "Unlimited file size",
          "Unlimited daily transfers",
          "100GB Cloud Storage",
          "Priority processing",
          "Maximum transfer speed",
        ],
        buttonText: "Upgrade to Pro",
        buttonColor: "bg-[#8B5CF6] text-white",
        isPopular: true,
      },
    ],
  },
  testimonials: [
    {
      id: "1",
      name: "Priya Sharma",
      role: "Graphic Designer",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=100&h=100",
      description:
        "AnyDrop ne mera kaam bohot aasan kar diya! Heavy design files laptop se phone mein seconds mein transfer ho jaati hain.",
    },
    {
      id: "2",
      name: "Rahul Verma",
      role: "Software Developer",
      img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?fit=crop&w=100&h=100",
      description:
        "Finally a file sharing app that works without internet! Perfect for sharing large project files with my team in office.",
    },
    {
      id: "3",
      name: "Ananya Patel",
      role: "College Student",
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=100&h=100",
      description:
        "Notes aur assignments share karna kabhi itna easy nahi tha. AnyDrop is a must-have for every student!",
    },
    {
      id: "4",
      name: "Vikram Singh",
      role: "YouTuber",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100",
      description:
        "Transferring 4K video files from my camera to editing laptop is super fast now. No more waiting for hours!",
    },
    {
      id: "5",
      name: "Neha Gupta",
      role: "Marketing Manager",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=100&h=100",
      description:
        "Our team uses AnyDrop daily for sharing campaign assets. The cross-platform support is amazing!",
    },
  ],
  footerLinks: [
    {
      title: "Company",
      links: [
        { id: 1, title: "About", url: "#" },
        { id: 2, title: "Contact", url: "#" },
        { id: 3, title: "Blog", url: "#" },
        { id: 4, title: "Story", url: "#" },
      ],
    },
    {
      title: "Products",
      links: [
        { id: 5, title: "Company", url: "#" },
        { id: 6, title: "Product", url: "#" },
        { id: 7, title: "Press", url: "#" },
        { id: 8, title: "More", url: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { id: 9, title: "Press", url: "#" },
        { id: 10, title: "Careers", url: "#" },
        { id: 11, title: "Newsletters", url: "#" },
        { id: 12, title: "More", url: "#" },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
