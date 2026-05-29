import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "../ui/separator";
import GoogleIcon from "../iconComp/GoogleIcon";
import DiscordIcon from "../iconComp/DiscordIcon";

const t = {
  cardTitle: "Sign up for an account",
  cardDescription: "Enter your details below to create an account",
  nameLabel: "Name",
  namePlaceholder: "Mighty Mike",
  emailLabel: "Email",
  emailPlaceholder: "mightymike@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "********",
  forgotPassword: "Forgot your password?",
  loginButton: "Sign Up",
  googleButton: "Google",
  discordButton: "Discord",
  cardFooter: "Already have an account?",
  cardFooterLink: "SignIn",
  backToHome: "Back to home",
};

export default function SignUpForm() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Button
        asChild
        variant="ghost"
        className="absolute left-4 top-4 md:left-8 md:top-8"
      >
        <Link href="/">
          <ArrowLeft />
          {t.backToHome}
        </Link>
      </Button>
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle>{t.cardTitle}</CardTitle>
          <CardDescription>{t.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t.nameLabel}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.namePlaceholder}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t.passwordLabel}</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t.forgotPassword}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  placeholder={t.passwordPlaceholder}
                  type="password"
                  required
                />
              </div>
            </div>
            <div>
              <Button className="w-full mt-3 uppercase tracking-wider">
                {t.loginButton}
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
              <Button type="button" variant="outline" className="w-full">
                <GoogleIcon className="mr-2" />
                {t.googleButton}
              </Button>
              <Button type="button" variant="outline" className="w-full">
                <DiscordIcon className="mr-2" />
                {t.discordButton}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="flex flex-row items-center gap-2">
            <p className="text-sm text-muted-foreground">{t.cardFooter}</p>
            <Link
              href="/signIn"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.cardFooterLink}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
