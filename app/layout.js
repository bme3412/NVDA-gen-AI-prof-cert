import './globals.css';

export const metadata = {
  title: 'NVIDIA Gen AI LLMs – Study Tracker',
  description: 'Track progress, readings, and notes for the NVIDIA Gen AI LLMs certification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


