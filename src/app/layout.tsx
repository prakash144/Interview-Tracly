import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster } from "sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const repoName = 'Interview-Tracly';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === "production" ? `/${repoName}` : "");

export const metadata: Metadata = {
    metadataBase: new URL(`https://prakash144.github.io/${repoName}`),
    title: "Interview Tracly",
    description: "Track your journey. Crack your dream company.",
    icons: {
        icon: [
            { url: `${basePath}/assets/branding/favicon/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
            { url: `${basePath}/assets/branding/favicon/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
            { url: `${basePath}/assets/branding/favicon/favicon.ico`, type: "image/x-icon" },
        ],
        apple: `${basePath}/assets/branding/favicon/apple-touch-icon.png`,
        shortcut: { url: `${basePath}/assets/branding/favicon/favicon-32x32.png`, type: "image/png" },
    },
    manifest: `${basePath}/assets/branding/favicon/site.webmanifest`,
    openGraph: {
        title: "Interview Tracly",
        description: "Track your journey. Crack your dream company.",
        type: "website",
        url: "/",
        siteName: "Interview Tracly",
        images: [
            {
                url: `assets/branding/favicon/android-chrome-192x192.png`,
                width: 192,
                height: 192,
                alt: "Interview Tracly",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Interview Tracly",
        description: "Track your journey. Crack your dream company.",
        images: [`assets/branding/favicon/android-chrome-192x192.png`],
    },
};

const FLASH_SCRIPT = `(function(){try{var m=localStorage.getItem("interview-tracly-theme");if(!m||(m!=="dark"&&m!=="light"&&m!=="system"))m="system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d);var a=localStorage.getItem("interview-tracly-accent");if(a)document.documentElement.style.setProperty("--accent-color",a)}catch(e){document.documentElement.classList.add("dark")}})()`;

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <meta name="theme-color" content="#22c55e" />
            <script dangerouslySetInnerHTML={{ __html: FLASH_SCRIPT }} />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster
              richColors
              closeButton
              position="bottom-right"
              expand
              visibleToasts={5}
              gap={8}
              toastOptions={{
                duration: 4000,
                style: { fontSize: "13px", padding: "12px 16px", borderRadius: "10px" },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
        </body>
        </html>
    );
}
