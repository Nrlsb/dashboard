import './globals.css';

export const metadata = {
  title: 'Price Dashboard | Pinturerías',
  description: 'Sistema inteligente de monitoreo de precios',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="container animate-fade-in">
          {children}
        </div>
      </body>
    </html>
  );
}
