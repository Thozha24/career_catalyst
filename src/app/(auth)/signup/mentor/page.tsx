import { RegisterForm } from "../student/register-form";

export const metadata = { title: "Mentor Registration" };

export default function MentorSignupPage() {
  return <RegisterForm role="MENTOR" />;
}
