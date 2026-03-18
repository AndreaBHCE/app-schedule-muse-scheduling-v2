import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(243, 244, 246, 0.75)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, minWidth: 360 }}>
        <SignIn
          appearance={{
            variables: {
              fontSize: "18px",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              colorText: "#0f172a",
            },
          }}
        />
      </div>
    </div>
  );
}
