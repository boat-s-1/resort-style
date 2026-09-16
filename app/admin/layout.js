export default function AdminLayout({ children }) {
  return (
    <>
      <style>{`
        .admin-login label:first-of-type {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
