import { useTranslation } from "react-i18next";
import Link from "next/link";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "../v2";

export default function InitialSignupStep() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full flex-col items-center justify-center">
      <h1 className="mb-8 bg-gradient-to-b from-white to-bunker-200 bg-clip-text text-center text-xl font-medium text-transparent">
        {t("signup.initial-title")}
      </h1>
      <div className="mt-4 w-1/4 min-w-[20rem] rounded-md text-center lg:w-1/6">
        <Button
          colorSchema="primary"
          variant="outline_bg"
          leftIcon={<FontAwesomeIcon icon={faEnvelope} className="mr-2" />}
          className="mx-0 h-12 w-full"
          isDisabled
        >
          Continue with Email
        </Button>
      </div>
      <div className="mt-6 w-1/4 min-w-[20rem] px-8 text-center text-xs text-bunker-400 lg:w-1/6">
        {t("signup.create-policy")}
      </div>
      <div className="mt-2 flex flex-row text-xs text-bunker-400">
        <Link href="/login">
          <span className="cursor-pointer duration-200 hover:text-bunker-200 hover:underline hover:decoration-primary-700 hover:underline-offset-4">
            {t("signup.already-have-account")}
          </span>
        </Link>
      </div>
    </div>
  );
}
