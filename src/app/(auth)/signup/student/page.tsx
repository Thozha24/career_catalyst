import { RegisterForm } from "./register-form";

export const metadata = { title: "Student Registration" };

export default function StudentSignupPage() {
  return <RegisterForm role="STUDENT" />;
}
