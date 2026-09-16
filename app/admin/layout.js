import AdminLoginEmailFix from './AdminLoginEmailFix';

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminLoginEmailFix />
      <style>{`
        .admin-login {
          display: grid;
          gap: 16px;
        }
        .admin-login label:first-of-type {
          display: none !important;
        }
        .admin-login label {
          display: grid;
          gap: 7px;
          width: 100%;
        }
        .admin-login input {
          width: 100%;
          min-width: 0;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid #d9d1ca;
          border-radius: 10px;
          font: inherit;
        }
        .admin-login .admin-primary {
          width: 100%;
          min-height: 52px;
        }
        @media (max-width: 640px) {
          .admin-login {
            width: 100%;
            padding: 22px 18px;
          }
        }
      `}</style>
      {children}
    </>
  );
}
