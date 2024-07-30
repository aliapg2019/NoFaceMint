import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import react from "@astrojs/react";
import dotenv from 'dotenv';

// بارگذاری متغیرهای محیطی
dotenv.config();
// https://astro.build/config
export default defineConfig({
  site: "https://test-astro.liara.run/",
  integrations: [tailwind(), mdx(), sitemap(), icon(), react()],
  vite: {
    define: {
      'import.meta.env.PINATA_JWT': JSON.stringify(process.env.PINATA_JWT),
    },
  },
});