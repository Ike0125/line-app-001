export const dynamic = "force-dynamic";

import { Suspense } from "react";
import SignInInner from "./SignInInner";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
