export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-900 py-6 text-center text-gray-600 text-xs mt-auto">
      <p>© {new Date().getFullYear()} VPP Operator Dashboard. AI-Powered Arbitrage.</p>
    </footer>
  );
}