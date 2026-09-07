"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { loginSchema } from "@/lib/validation";
import { AuthBrandPanel, MobileAuthBrand } from "@/components/AuthBrand";
import styles from "../auth.module.css";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const justRegistered = searchParams.get("registered") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (res?.error) {
        setFormError("Invalid username or password");
      } else {
        router.push("/");
      }
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <MobileAuthBrand />
          <Card title="Log in" subTitle="Welcome back — pick up where you left off.">
            <form onSubmit={handleSubmit} className={styles.form}>
              <Message
                severity="info"
                text="Demo login: username 'demo', password 'demo1234'"
              />
              {justRegistered && (
                <Message severity="success" text="Account created — log in below." />
              )}
              {formError && <Message severity="error" text={formError} />}

              <div className={styles.field}>
                <label htmlFor="username">Username</label>
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldErrors.username ? "p-invalid" : ""}
                />
                {fieldErrors.username && (
                  <small className={styles.errorText}>{fieldErrors.username}</small>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <Password
                  inputId="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  className={fieldErrors.password ? "p-invalid" : ""}
                />
                {fieldErrors.password && (
                  <small className={styles.errorText}>{fieldErrors.password}</small>
                )}
              </div>

              <Button label="Log in" loading={submitting} type="submit" />
            </form>

            <p className={styles.footerLink}>
              <Link href="/forgot-password">Forgot password?</Link>
            </p>
            <p className={styles.footerLink}>
              New here? <Link href="/register">Create an account</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
