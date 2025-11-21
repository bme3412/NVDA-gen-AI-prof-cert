import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Gen AI LLMs – Study Tracker',
  description: 'Track progress, readings, and notes for the NVIDIA Gen AI LLMs certification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}


