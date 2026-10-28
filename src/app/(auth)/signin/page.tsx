import { SignInForm } from "./signin-form";

export const metadata = { title: "Sign In" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const params = await searchParams;
  return (
    <div>
      {params.reset ? (
        <div className="mb-4 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700 ring-1 ring-inset ring-success-100">
          Password updated — sign in with your new password.
        </div>
      ) : null}
      <SignInForm nextPath={params.next} />
    </div>
  );
}
